// @ts-strict-ignore
import { ManagedPolicy,ServicePrincipal,Role } from "aws-cdk-lib/aws-iam"

/**
 * 
 * @param roleNmae : role name to launch the lambda
 * @param scope : app-stack scope
 * @returns 
 */
export function createLambdaExecuteRole(roleNmae, scope) {
    
    const role = new Role(scope, roleNmae, {
        assumedBy: new ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
            ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
        ],
    })

    return role
}