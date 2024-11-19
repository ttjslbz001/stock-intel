// @ts-strict-ignore
import { Construct } from 'constructs';
import {
  BundlingOptions,
  NodejsFunction,
  NodejsFunctionProps,
} from 'aws-cdk-lib/aws-lambda-nodejs';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { fusionDefaults } from './fusionDefault';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';

export interface FusionNodejsFunctionProps extends NodejsFunctionProps {
  account: string;
  environmentName: string;
  environmentMapping?: any;
  isNeedNodejsLayer?: boolean;
  // TODO: implement these
  //isMySqlClient?: boolean
  //isPostgresClient?: boolean
  //isDynamoDbClient?: boolean
  //isHttpClient?: boolean
  //isSftpClient?: boolean
}

export class FusionNodeFunction extends NodejsFunction {
  constructor(scope: Construct, id: string, props: FusionNodejsFunctionProps) {
    const {
      account,
      environmentName, // fusion props
      runtime,
      entry,
      layers = [],
      handler,
      awsSdkConnectionReuse,
      depsLockFilePath,
      environmentMapping,
      isNeedNodejsLayer = true,
      bundling: desiredBundling = {}, // FusionNodejsFunctionProps
      ...functionProps
    } = props;

    const serviceLayerArn = StringParameter.valueForStringParameter(
      scope,
      'service-framework-layer-nodejs-NodeMicroservicesDependenciesLayerArn'
    );
    const serviceLayer = LayerVersion.fromLayerVersionArn(
      scope,
      'FusionNodeFunctionLayer' + id,
      serviceLayerArn
    );

    let defaultProps = {};
    if (!environmentMapping) {
      defaultProps = fusionDefaults(id, {
        ...functionProps,
        account,
        environmentName,
        handler: handler ?? 'handler',
        layers: isNeedNodejsLayer ? [...layers, serviceLayer] : [...layers],
        runtime: Runtime.NODEJS_20_X,
        code: undefined as any,
        // securityGroups: functionProps.securityGroups
        //     ? functionProps.securityGroups
        //     : [
        //           SecurityGroup.fromSecurityGroupId(
        //               scope,
        //               id + 'LambdaSecurityGroup',
        //               Fn.importValue(`service-framework-networking-${environmentName}-SeguroLambdaSGId`),
        //           ),
        //       ],
        // vpc: functionProps.vpc
        //     ? functionProps.vpc
        //     : Vpc.fromLookup(scope, `${id}vpc`, {
        //           vpcId: StringParameter.valueFromLookup(scope, `service-framework-networking-${environmentName}-SeguroVPCId`),
        //       }),
      });
    } else {
      defaultProps = fusionDefaults(id, {
        ...functionProps,
        account,
        environmentName,
        handler: handler ?? 'handler',
        layers: isNeedNodejsLayer ? [...layers, serviceLayer] : [...layers],
        runtime: Runtime.NODEJS_20_X,
        code: undefined as any,
        // securityGroups: functionProps.securityGroups
        //     ? functionProps.securityGroups
        //     : [
        //           SecurityGroup.fromSecurityGroupId(
        //               scope,
        //               id + 'LambdaSecurityGroup',
        //               Fn.importValue(`service-framework-networking-${environmentName}-SeguroLambdaSGId`),
        //           ),
        //       ],
        // vpc: functionProps.vpc
        //     ? functionProps.vpc
        //     : Vpc.fromVpcAttributes(scope, `${id}vpc`, {
        //           vpcId: Fn.findInMap(environmentMapping, environmentName, 'vpcId'),
        //           availabilityZones: Fn.split(',', Fn.findInMap(environmentMapping, environmentName, 'availabilityZones')),
        //           publicSubnetIds: Fn.split(',', Fn.findInMap(environmentMapping, environmentName, 'publicSubnetIds')),
        //           privateSubnetIds: Fn.split(',', Fn.findInMap(environmentMapping, environmentName, 'privateSubnetIds')),
        //       }),
      });
    }
    const layerModules = [
      'aws-sdk',
      '@aws-sdk/client-s3',
      '@aws-sdk/credential-providers',
      '@aws-sdk/is-array-buffer',
      '@aws-sdk/protocol-http',
      '@aws-sdk/querystring-builder',
      '@aws-sdk/s3-request-presigner',
      '@aws-sdk/signature-v4',
      '@aws-sdk/util-format-url',
      '@aws-sdk/util-hex-encoding',
      '@aws-sdk/util-uri-escape',
      'yup',
      'aws-cdk-lib', // This will reveal any runtime dependencies on the CDK.
      'axios',
      'bluebird',
      'casbin',
      'change-case',
      'jsonpath-mapper',
      'jsonwebtoken',
      'lodash',
      'moment',
      'moment-timezone',
      'pg',
      'pg-format',
      'pg-native',
      'promise-memoize',
      'reflect-metadata',
      'semver',
      'winston',
    ];

    const nodeModulesSet = new Set([
      ...(desiredBundling?.nodeModules ?? []),
      'cpu-features',
    ]);
    const desiredBundlingSet = new Set(
      isNeedNodejsLayer
        ? [...(desiredBundling?.externalModules ?? []), ...layerModules]
        : [...(desiredBundling?.externalModules ?? [])]
    );
    const bundling: BundlingOptions = {
      ...desiredBundling,
      nodeModules: Array.from(nodeModulesSet),
      externalModules: Array.from(desiredBundlingSet),
    };

    super(scope, id, {
      ...defaultProps,
      entry,
      handler,
      awsSdkConnectionReuse,
      depsLockFilePath,
      bundling,
    });
  }
}
