import { Alias, CfnAlias, CfnAliasProps, CfnPermission } from 'aws-cdk-lib/aws-lambda'
import { ServicePrincipal } from 'aws-cdk-lib/aws-iam';
import { Aws, CfnCondition, Fn } from 'aws-cdk-lib/core';
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'

export function addLambdaProvisioning(scope: Construct, lambdaFunc: lambda.Function, id: string, lambdaProvisionedConcurrentExecutions: number) {
    const version = lambdaFunc.currentVersion
    const lambdaAlias = new Alias(scope, id, {
        aliasName: 'provisioned',
        version: version,
        provisionedConcurrentExecutions: lambdaProvisionedConcurrentExecutions > 0 ? lambdaProvisionedConcurrentExecutions : undefined,
    })
    lambdaAlias.grantInvoke(new ServicePrincipal('apigateway.amazonaws.com'))
    return lambdaAlias
}

export function addLambdaProvisioningDynamic(scope: Construct, lambdaFunc: lambda.Function, id: string, lambdaProvisionedConcurrentExecutions: number) {
    const version = lambdaFunc.currentVersion
    const condition = new CfnCondition(scope, `isEmpty${id}`, {
        expression: Fn.conditionEquals(lambdaProvisionedConcurrentExecutions, 0)
    })
    let props: CfnAliasProps = {
        functionName: version.lambda.functionArn,
        functionVersion: version.version,
        name: 'provisioned',
        provisionedConcurrencyConfig: Fn.conditionIf(condition.logicalId, Aws.NO_VALUE, {
            ProvisionedConcurrentExecutions: lambdaProvisionedConcurrentExecutions
        })
    }
    const lambdaAlias = new CfnAlias(scope, id, props)
    new CfnPermission(lambdaAlias, `ApiGatewayInvokePermission`, {
        action: 'lambda:InvokeFunction',
        functionName: `${lambdaFunc.functionArn}:${lambdaAlias.name}`,
        principal: 'apigateway.amazonaws.com',
    }).addDependency(lambdaAlias)
    return {
        functionArn: `${lambdaFunc.functionArn}:${lambdaAlias.name}`,
        cfnAlias: lambdaAlias,
    }
}