import { Duration } from 'aws-cdk-lib/core'
import { FunctionProps, Runtime } from 'aws-cdk-lib/aws-lambda'

export interface FusionDefaultsProps extends FunctionProps {
	account: string
	environmentName: string
}

export function fusionDefaults(id: string, props: FusionDefaultsProps): FunctionProps {
	const { account, environmentName, environment, ...functionOpts } = props

	const fusionEnviroment = {
		...environment,
		STAGE: environmentName,
		AWS_ACCOUNT_ID: account,
	}

	const runtime = defaultProp(props.runtime, Runtime.NODEJS_20_X)
	const memorySize = defaultProp(props.memorySize, 1024)
	const timeout = defaultProp(props.timeout, Duration.seconds(60))

	return {
		...functionOpts,
		timeout,
		runtime,
		memorySize,
		environment: fusionEnviroment,
	}
}

function defaultProp(prop: any, defaultValue: any): any {
	return prop !== null && prop !== void 0 ? prop : defaultValue
}
