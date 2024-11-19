import { LambdaProxyEvent } from '@fusion/common'
import { UserHeaderProcessor } from './executor'
import { Context } from 'aws-lambda'
import jwtDecode from 'jwt-decode'

export class BaseUserHeaderProcessor<E extends LambdaProxyEvent, C extends Context> implements UserHeaderProcessor<LambdaProxyEvent, Context> {
	process(event: E, context: C, logger?: any) {
		const params = {
			XRequestId: context?.awsRequestId,
		}
		process.env.requestParam = JSON.stringify(params)
		logger?.info('Added XRequestId to request parameters', { request_param: params })
	}
}

export class UserInfoHeaderProcessor<E extends LambdaProxyEvent, C extends Context> implements UserHeaderProcessor<LambdaProxyEvent, Context> {
	async process(event: E, context: C, logger?: any) {
		const debugHeader = event.headers['X-Debug'] ?? event.headers['x-debug']
		const isDebug = debugHeader?.toString().toLowerCase() === 'true'
		const params = {
			isDebug,
		}

		const header = event.headers['Authorization'] ?? event.headers['authorization']
		const accessToken = header?.replace('Bearer ', '')
		if (accessToken) {
			const decodedToken: any = jwtDecode(accessToken)

			const clientId = decodedToken.client_id
			const username = decodedToken['username']
			const userId = decodedToken['sub']

			Object.assign(params, {
				clientId,
				username,
				userId,
			})
		}

		process.env.requestParam = JSON.stringify(params)
		logger?.info('Added user info to request parameters', { request_param: params })
	}
}

export function getRequestHeaderParams() {
	if (!process?.env?.requestParam) {
		return undefined
	}
	return JSON.parse(process.env.requestParam)
}
