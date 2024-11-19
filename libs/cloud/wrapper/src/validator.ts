// @ts-strict-ignore
import { RequestValidator } from './executor'
import * as Yup from 'yup'
import { Logger } from 'winston'
import { FusionServerError, LambdaProxyEvent } from '@fusion/common'

export class YupRequestBodyValidator implements RequestValidator<LambdaProxyEvent, FusionServerError> {
	private schema: Yup.DateSchema

	constructor(schema) {
		this.schema = schema
	}

	async validate(event: LambdaProxyEvent, context?: any, logger?: Logger): Promise<void> {
		try {
			const payload = JSON.parse(event.body)
			await this.schema.validate(payload, { abortEarly: false })
		} catch (error) {
			logger?.debug(JSON.stringify(error))
			const message = error.errors ?? error.message
			// Handle validation errors here, e.g., throw a custom error or log the message
			throw new FusionServerError('error', message, 'invalid_request')
		}
	}
}

export class YupRequestQueryParamtersValidator implements RequestValidator<LambdaProxyEvent, FusionServerError> {
	private schema: Yup.DateSchema

	constructor(schema) {
		this.schema = schema
	}

	async validate(event: LambdaProxyEvent, context?: any, logger?: Logger): Promise<void> {
		try {
			const payload = event.queryStringParameters ?? {}
			await this.schema.validate(payload, { abortEarly: false })
		} catch (error) {
			logger?.debug(JSON.stringify(error))
			const message = error.errors ?? error.message
			// Handle validation errors here, e.g., throw a custom error or log the message
			throw new FusionServerError('error', message, 'invalid_request')
		}
	}
}

export function isValidUtcDateTimeFormat(_, ctx) {
	const originalValue = ctx['originalValue']
	if (!originalValue) {
		return true
	}
	// Regular expression to match the ISO 8601 UTC time format ending with 'Z'
	const regex = /^\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d(\.\d{1,3})?Z$/
	return regex.test(originalValue)
}
