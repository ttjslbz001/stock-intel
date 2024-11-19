// @ts-strict-ignore
import { HttpResponseDecorator } from './executor'
import {
	FusionServerError,
	FusionServerResponse,
	LambdaProxyEvent,
	badRequest,
	conflict,
	forbidden,
	notAuthorizedWithBody,
	notFound,
	ok,
	serverError,
	tooManyRequests,
	unauthorized,
	pending,
} from '@fusion/common'

import { APIGatewayProxyResult } from 'aws-lambda'

export class ResponseDecorator<E extends LambdaProxyEvent, R extends APIGatewayProxyResult> implements HttpResponseDecorator<E, R> {
	private errorCodeMapping
	private successStatusMapping

	constructor(errorCodeMapping: { [key: string]: any }, successStatusMapping: { [key: string]: any }) {
		this.errorCodeMapping = errorCodeMapping
		this.successStatusMapping = successStatusMapping
	}

	convertToSuccessResponse(payload, multiValueHeaders?, logger?): R {
		try {
			if (payload instanceof FusionServerResponse) {
				const status = payload.status
				const successFunc = this.successStatusMapping[status]
				logger?.debug(`get function ${successFunc} with status ${status}`)
				if (successFunc) {
					return successFunc(getNovoServerResponsePayload(payload), multiValueHeaders)
				} else {
					return ok(getNovoServerResponsePayload(payload), multiValueHeaders)
				}
			}
			return ok(payload, multiValueHeaders)
		} catch (error) {
			logger?.error('Failed to convert success resonse')
			return ok(payload, multiValueHeaders)
		}
	}

	convertToErrorResponse(error, multiValueHeaders?, logger?): R {
		if (error instanceof FusionServerError) {
			const httpResponFunc = this.errorCodeMapping[error.error_code]
			logger?.debug(`get error code function ${httpResponFunc} with error code ${error.error_code}`)
			logger?.debug(JSON.stringify(this.errorCodeMapping))

			if (httpResponFunc) {
				logger?.debug('convert with http response func')
				let body = {
					status: error.status,
					message: error.message,
					error_code: error.error_code,
				}
				if (error.additionalProperties) {
					body = {
						...body,
						...error.additionalProperties,
					}
				}
				const response = httpResponFunc(body, multiValueHeaders)
				logger?.debug(response)
				return response
			} else {
				logger?.warn(`failed to get function to handle error code : ${error.error_code}`)
				//logger?.debug("convert to server error")
				return serverError(
					{
						status: 'failed',
						message: 'The request encountered a processing failure.',
						error_code: 'server_error',
					},
					multiValueHeaders,
				) as R
			}
		} else {
			return serverError({
				status: 'failed',
				message: 'The request encountered a processing failure.',
				error_code: 'server_error',
			}) as R
		}
	}
}

export const errorCodeMapping = {
	not_authorized: notAuthorizedWithBody,
	invalid_request: badRequest,
	state_not_supported: badRequest,
	vehicle_not_found: badRequest,
	eligible_vehicle_not_found: badRequest,
	multiple_vehicles_matched: badRequest,
	policy_not_supported: badRequest,
	policy_not_found: badRequest,
	server_error: serverError,
	quote_in_progress: pending,
	bind_in_progress: pending,
	too_many_requests: tooManyRequests,
	unauthorized: unauthorized,
	invalid_otp: badRequest,
	account_not_found: notFound,
	profile_not_found: notFound,
	transaction_not_found: badRequest,
	forbidden: forbidden,
	conflict: conflict,
}

export const successStatusMapping = {
	success: ok,
	pending: pending,
}

export function getNovoServerResponsePayload(novoServerResponse: FusionServerResponse) {
	const result = {
		status: novoServerResponse.status,
	}
	if (novoServerResponse.message) {
		result['message'] = novoServerResponse.message
	}
	if (novoServerResponse.payloadName && novoServerResponse.payload) {
		result[novoServerResponse.payloadName] = novoServerResponse.payload
	}
	return result
}
