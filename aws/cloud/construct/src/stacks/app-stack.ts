import * as path from 'path';
import { StringParameter } from 'aws-cdk-lib/aws-ssm';
import { Code, Runtime, LayerVersion } from 'aws-cdk-lib/aws-lambda';
import {
  CfnMapping,
  CfnParameter,
  RemovalPolicy,
  Stack,
  StackProps,
  Tags,
} from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { cdkContext } from '@stock-intelligence/cloud/construct';

export class AppStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const environmentMapping = 'EnvironmentMapping';
    new CfnMapping(this, environmentMapping, {
      mapping: {
        ...cdkContext,
      },
    });

    const env = new CfnParameter(this, 'Environment', { default: 'dev' })
      .valueAsString;
    Tags.of(this).add('Environment', env);

    const layer = new LayerVersion(this, `PythonLib}`, {
      code: Code.fromAsset(
        path.join(
          __dirname,
          '../',
          '../',
          '../',
          '../',
          '../',
          '../',
          '../',
          'lib'
        )
      ),
      removalPolicy: RemovalPolicy.RETAIN,
      compatibleRuntimes: [Runtime.PYTHON_3_10, Runtime.PYTHON_3_12],
      license: 'Apache-2.0',
      description: 'a layer for services/lib/',
    });

    new StringParameter(this, 'PythonLibArn', {
      parameterName: `${Stack.of(this).stackName}-${env}-PythonLibArn`,
      stringValue: layer.layerVersionArn,
      simpleName: false,
    });

    new StringParameter(this, 'DefaultPythonLibArn', {
      parameterName: `${Stack.of(this).stackName}-PythonLibArn`,
      stringValue: layer.layerVersionArn,
    });
  }
}
