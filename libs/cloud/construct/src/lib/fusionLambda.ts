// @ts-strict-ignore
import {
  CfnDynamicReference,
  CfnDynamicReferenceService,
  Duration,
  Fn,
} from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { Role, IRole, ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import {
  ILayerVersion,
  LayerVersion,
  Runtime,
  Tracing,
} from 'aws-cdk-lib/aws-lambda';
import {
  PythonFunction,
  PythonFunctionProps,
} from '@aws-cdk/aws-lambda-python-alpha';
import { Vpc, SecurityGroup } from 'aws-cdk-lib/aws-ec2';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { tryGetFromContext } from './tryGetFromContext';

export interface LambdaProps {
  /** the function for which we want to count url hits **/
  // downstream: lambda.IFunction;
  handler: string;
  map?: string;
  account?: string;
  memorySize?: number;
  entry: string;
  index: string;
  role?: IRole;
  environment: string;
  environmentVariables?: Record<string, string>;
}

export class LambdaConstruct extends Construct {
  public readonly functionArn: string;
  public func: PythonFunction;

  constructor(scope: Construct, id: string, props: LambdaProps) {
    super(scope, id);

    let rdsCrmSecret = '';
    let rdsQ2bSecret = '';
    let vpc, account;
    let layers: Array<ILayerVersion> = [];
    if (props.map) {
      rdsQ2bSecret = Fn.findInMap(props.map, props.environment, 'rdsQ2bSecret');
      rdsCrmSecret = Fn.findInMap(props.map, props.environment, 'rdsCrmSecret');

      const pythonLibArn = new CfnDynamicReference(
        CfnDynamicReferenceService.SSM,
        `service-framework-layer-python-lib-${props.environment}-PythonLibArn`
      ).toString();
      layers.push(
        LayerVersion.fromLayerVersionArn(
          this,
          'CustomLibraryDependencies',
          pythonLibArn
        )
      );
      const pythonDepsArn = new CfnDynamicReference(
        CfnDynamicReferenceService.SSM,
        `service-framework-layer-python-${props.environment}-PythonDependenciesArn`
      ).toString();
      layers.push(
        LayerVersion.fromLayerVersionArn(
          this,
          'PythonDependencies',
          pythonDepsArn
        )
      );

      vpc = Vpc.fromVpcAttributes(scope, `${id}vpc`, {
        vpcId: Fn.findInMap(props.map, props.environment, 'vpcId'),
        availabilityZones: Fn.split(
          ',',
          Fn.findInMap(props.map, props.environment, 'availabilityZones')
        ),
        publicSubnetIds: Fn.split(
          ',',
          Fn.findInMap(props.map, props.environment, 'publicSubnetIds')
        ),
        privateSubnetIds: Fn.split(
          ',',
          Fn.findInMap(props.map, props.environment, 'privateSubnetIds')
        ),
      });
      account = props.account
        ? props.account
        : Fn.findInMap(props.map, props.environment, 'account');
    } else {
      rdsQ2bSecret = tryGetFromContext(this, props.environment, 'rdsQ2bSecret');
      rdsCrmSecret = tryGetFromContext(this, props.environment, 'rdsCrmSecret');

      const pythonLibArn = StringParameter.valueFromLookup(
        this,
        `service-framework-layer-python-lib-${props.environment}-PythonLibArn`
      );
      layers.push(
        LayerVersion.fromLayerVersionArn(
          this,
          'CustomLibraryDependencies',
          pythonLibArn
        )
      );
      const pythonDepsArn = StringParameter.valueFromLookup(
        this,
        `service-framework-layer-python-${props.environment}-PythonDependenciesArn`
      );
      layers.push(
        LayerVersion.fromLayerVersionArn(
          this,
          'PythonDependencies',
          pythonDepsArn
        )
      );

      vpc = Vpc.fromLookup(this, `${id}vpc`, {
        vpcId: StringParameter.valueFromLookup(
          scope,
          `service-framework-networking-${props.environment}-SeguroVPCId`
        ),
      });
      account = props.account;
    }

    const securityGroup = SecurityGroup.fromSecurityGroupId(
      scope,
      `LambdaSecurityGroup${id}`,
      Fn.importValue(
        `service-framework-networking-${props.environment}-SeguroLambdaSGId`
      )
    );

    const role =
      props.role ||
      Role.fromRoleArn(
        this,
        'lambdaRole',
        Fn.importValue(
          `service-framework-security-${props.environment}-SeguroLambdaExecutionRoleArn`
        )
      );

    let lambdaProps: PythonFunctionProps = {
      entry: props.entry,
      index: props.index,
      handler: props.handler,
      runtime: Runtime.PYTHON_3_12,
      role,
      memorySize: props.memorySize || 1024,
      layers: layers,
      vpc: vpc,
      securityGroups: [securityGroup],
      timeout: Duration.seconds(60),
      tracing: Tracing.ACTIVE, // this enables x-rays
      environment: {
        STAGE: props.environment,
        AWS_ACCOUNT_ID: account || '',
        RDS_Q2B_SECRET: rdsQ2bSecret,
        RDS_CRM_SECRET: rdsCrmSecret,
        ...props.environmentVariables,
      },
    };

    this.func = new PythonFunction(this, id, lambdaProps);
    this.func.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'));
    this.functionArn = this.func.functionArn;
  }
}
