// @ts-strict-ignore

import { ActivityLogger } from './executor'
import { APIGatewayProxyResult } from 'aws-lambda'
import { Logger } from 'winston'
import { isEmpty } from 'lodash'
import { FusionServerError, LambdaProxyEvent } from '@fusion/common'
import { generateApplicationLogObj, getLogger } from '@fusion/utils'

type NestedObject = {
	[key: string]: any
}

export function getEventTraceIdFunc(event: LambdaProxyEvent, expression: string, logger?: Logger): string {
	if (isEmpty(expression)) {
		return ''
	}
	const keys = expression.split('.')
	const header = keys[0]

	switch (header) {
		case 'queryStringParameters':
			return event.queryStringParameters[keys[1]]
		case 'pathParameters':
			return event.pathParameters[keys[1]]
		case 'body':
			const request = JSON.parse(event.body)
			return getValueByExpression(request, expression.substring('body.'.length))
		default:
			logger?.error(`failed to get trace id from event ${event} with expression: ${expression}`)
			return ''
	}
}

export function getValueByExpression(obj: NestedObject, expression: string): any {
	const keys = expression.split('.')
	let current = obj

	if (isEmpty(expression)) {
		return ''
	}
	for (const key of keys) {
		if (current[key] === undefined) {
			return undefined
		}
		current = current[key]
	}

	return current
}

export class BaseActivityLogger<E extends LambdaProxyEvent, R extends APIGatewayProxyResult, T extends FusionServerError>
	implements ActivityLogger<LambdaProxyEvent, APIGatewayProxyResult, FusionServerError>
{
	private domain: string
	private eventName: string
	private getTracingIdFunc

	constructor(domain: string, eventName: string, getTracingIdFuncion: Function) {
		this.domain = domain
		this.eventName = eventName
		this.getTracingIdFunc = getTracingIdFuncion
	}

	logSuccessResponse(logger: Logger, event: LambdaProxyEvent, context: any, response: APIGatewayProxyResult, meta?: any) {
		logger.silly('call activity logger for success resp')
		const tracingId = this.getTracingIdFunc(event)
		if (!tracingId) {
			logger.error('failed to retrieve event id from event', event)
			return
		}

		const startTime = meta?.['startTime']

		logger.info(
			generateApplicationLogObj(this.eventName, tracingId, startTime, event, response, event?.body, response.statusCode, 'The request is currently in successfully.', {
				domain: this.domain,
			}),
		)
	}

	logErrorResponse(logger: Logger, event: LambdaProxyEvent, context: any, response: APIGatewayProxyResult, error: FusionServerError, meta?: any) {
		logger.silly('call activity logger for failed resp')
		const tracingId = this.getTracingIdFunc(event)

		if (!tracingId) {
			logger.error('failed to retrieve event id from event', event)
			return
		}

		const startTime = meta?.['startTime']
		const errorMessage = error.error ?? error.message
		logger.silly('call activity logger for failed resp')

		logger.info(
			generateApplicationLogObj(this.eventName, tracingId, startTime, event, response, event?.body, response.statusCode, errorMessage, {
				domain: this.domain,
			}),
		)
	}
}

export class PathExpressionActivityLogger<E extends LambdaProxyEvent, R extends APIGatewayProxyResult, T extends FusionServerError> extends BaseActivityLogger<E, R, T> {
	constructor(domain: string, eventName: string, expression: string) {
		let getTracingIdByExpression = (event) => {
			return getEventTraceIdFunc(event, expression, getLogger(event))
		}
		super(domain, eventName, getTracingIdByExpression)
	}
}
