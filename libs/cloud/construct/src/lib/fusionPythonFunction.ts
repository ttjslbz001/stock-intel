import {
  PythonFunction,
  PythonFunctionProps,
} from '@aws-cdk/aws-lambda-python-alpha';
import { LayerVersion, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { fusionDefaults } from './fusionDefault';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';

export interface FusionPythonFunctionProps extends PythonFunctionProps {
  account: string;
  environmentName: string;
  handler: string;
  environmentMapping?: any;
  isNeedPythonLayer?: boolean;
  // TODO: implement these
  //isMySqlClient?: boolean
  //isPostgresClient?: boolean
  //isDynamoDbClient?: boolean
  //isHttpClient?: boolean
  //isSftpClient?: boolean
}

export class FusionPythonFunction extends PythonFunction {
  constructor(scope: Construct, id: string, props: FusionPythonFunctionProps) {
    const {
      account,
      environmentName, // fusion props
      runtime,
      entry,
      layers = [],
      handler,
      environmentMapping,
      isNeedPythonLayer = true,
      bundling: desiredBundling = {}, // NodejsFunctionProps
      ...functionProps
    } = props;

    const serviceLayerArn = StringParameter.valueForStringParameter(
      scope,
      'service-framework-layer-python-PythonDependenciesArn'
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
        handler,
        layers: isNeedPythonLayer ? [...layers, serviceLayer] : [...layers],
        runtime: Runtime.PYTHON_3_12,
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
        handler,
        layers: isNeedPythonLayer ? [...layers, serviceLayer] : [...layers],
        runtime: Runtime.PYTHON_3_12,
        code: undefined as any,
      });
    }

    //const nodeModulesSet = new Set([...(desiredBundling?.nodeModules ?? []), 'cpu-features'])
    // const desiredBundlingSet = new Set(isNeedPythonLayer ? [...(desiredBundling?.externalModules ?? []), ...layerModules] : [...(desiredBundling?.externalModules ?? [])])
    // const bundling: BundlingOptions = {
    // 	...desiredBundling,
    // 	nodeModules: Array.from(nodeModulesSet),
    // 	externalModules: Array.from(desiredBundlingSet),
    // }

    super(scope, id, {
      ...defaultProps,
      entry,
      handler,
      runtime,
    });
  }
}
