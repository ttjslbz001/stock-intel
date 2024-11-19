import * as cdk from 'aws-cdk-lib/core';
import { AppStack } from './stacks/app-stack';
import { getTags } from '@stock-intelligence/cloud/construct';

const app = new cdk.App();
new AppStack(app, 'service-framework-layer-python-lib', {
  tags: getTags('Platform'),
});
