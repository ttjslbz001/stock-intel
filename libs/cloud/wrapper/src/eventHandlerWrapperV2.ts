// @ts-strict-ignore

import { Logger } from 'winston'
import { APIGatewayProxyResult, Context, Handler } from 'aws-lambda'
import { ActivityLogger, BusinessLogicHandler, ErrorProcessor, HttpResponseDecorator, RequestValidator, UserHeaderProcessor } from './executor'
import { FusionServerError, LambdaProxyEvent, getCorsHeaders, ok, serverError } from '@fusion/common'
import { getLogger } from '@fusion/utils'
const NO_CACHE = {
	'cache-control': ['no-cache'],
}

/**
 * Wraps the event handler to include validation, business logic execution, and response conversion.
 *
 * @param setHeadlessHeader - Flag to determine if the AWS request ID should be set in the request parameters.
 * @param businessHandler - The main business logic handler.
 * @param requestValidator - (Optional) Validator for the request event.
 * @param resultDecorator - (Optional) Decorator to convert results to HTTP responses.
 * @param errorProcessor - (Optional) Error processor.
 */

export interface RequestProcessor<E extends LambdaProxyEvent, R extends APIGatewayProxyResult, T extends FusionServerError, C extends Context> {
	businessHandler: BusinessLogicHandler<E>
	responseDecorator?: HttpResponseDecorator<E, R>
	requestValidator?: RequestValidator<E, T>
	errorProcessor?: ErrorProcessor<E>
	activityLogger?: ActivityLogger<E, R, T>
	userHeaderProcessor?: UserHeaderProcessor<E, C>
}

/*
 * @param setHeadlessHeader - Flag to determine if the AWS request ID should be set in the request parameters.
 */
export function wrapEventHandlerV2<E extends LambdaProxyEvent, R extends APIGatewayProxyResult, T extends FusionServerError, C extends Context>(
	setHeadlessHeader = false,
): (requestProcessor: RequestProcessor<E, R, T, C>) => Handler<LambdaProxyEvent, APIGatewayProxyResult> {
	return function (requestProcessor: RequestProcessor<E, R, T, C>): Handler<LambdaProxyEvent, APIGatewayProxyResult> {
		const wrappedMethod = async function (event: E, context?: C, callback?: any) {
			const startTime = Date.now()

			const logger: Logger = getLogger(context?.awsRequestId ?? '')
			logger.info('Starting event handling', { request_event: event })

			const corsDomains = process.env['CORS_ORIGINS']?.split(',') ?? []
			const multiValueHeaders = {
				multiValueHeaders: { ...NO_CACHE, ...getCorsHeaders(event, corsDomains) },
			}

			try {
				if (setHeadlessHeader) {
					setRequestIdInRequestParams(context, logger)
				}
				await requestProcessor.userHeaderProcessor?.process(event, context, logger)

				logger.info(`Validating event`)
				await requestProcessor.requestValidator?.validate(event, context, logger)

				logger.info('Executing business logic')
				const result = await requestProcessor.businessHandler.execute(event, context, callback, logger)

				logger.info('Converting successful result to response')
				logger.debug(JSON.stringify(result))

				const successResp = requestProcessor.responseDecorator
					? requestProcessor.responseDecorator.convertToSuccessResponse(result, multiValueHeaders, logger, event, context)
					: ok(result, multiValueHeaders)

				requestProcessor.activityLogger?.logSuccessResponse(logger, event, context, successResp, {
					startTime: startTime,
				})

				return successResp
			} catch (error) {
				logger.error(JSON.stringify(error))
				let errorResponse
				if (requestProcessor.responseDecorator) {
					logger.info('Convert error to response')
					errorResponse = requestProcessor.responseDecorator.convertToErrorResponse(error as any, multiValueHeaders, logger, event as E, context)
				} else {
					errorResponse = serverError(error?.message, multiValueHeaders)
				}

				try {
					requestProcessor.errorProcessor?.process(event, context, errorResponse, logger)
					requestProcessor.activityLogger?.logErrorResponse(logger, event, context, errorResponse, error as any, {
						startTime: startTime,
					})
				} catch (err) {}

				return errorResponse
			}
		}

		return wrappedMethod
	}
}

/**
 * Sets the AWS request ID in the request parameters.
 *
 * @param context - The AWS Lambda context.
 * @param logger - Logger instance.
 */
function setRequestIdInRequestParams(context?: Context, logger?: Logger) {
	const params = {
		XRequestId: context?.awsRequestId,
	}
	process.env.requestParam = JSON.stringify(params)
	logger?.info('Added XRequestId to request parameters', { request_param: params })
}
