// @ts-strict-ignore
import { APIGatewayProxyResult, Context } from 'aws-lambda'
import { Logger } from 'winston'
import { FusionServerError, LambdaProxyEvent } from '@fusion/common'

/**
 * Interface to convert successful or failed results to HTTP responses.
 */

export interface HttpResponseDecorator<E extends LambdaProxyEvent, R extends APIGatewayProxyResult> {
	convertToSuccessResponse(result, multiValueHeaders, logger?, event?: E, context?): R
	convertToErrorResponse(error, multiValueHeaders, logger?, event?: E, context?): R
}
/**
 * Interface to validate the request event.
 * Throws a server error with status 'INVALID_REQUEST' if validation fails.
 */

export interface RequestValidator<E extends LambdaProxyEvent, T extends FusionServerError> {
	validate(event: E, context?, logger?)
}
/**
 * Interface for the main business logic handler.
 */

export interface BusinessLogicHandler<E extends LambdaProxyEvent> {
	execute(event: E, context, callback?, logger?): Promise<any>
}
/**
 * Interface for the error Processor.
 */

export interface ErrorProcessor<E extends LambdaProxyEvent> {
	process(event: E, context, error, logger?)
}

export interface ActivityLogger<E extends LambdaProxyEvent, R extends APIGatewayProxyResult, T extends FusionServerError> {
	logSuccessResponse(logger: Logger, event: E, context: any, response: R, meta?: any)
	logErrorResponse(logger: Logger, event: E, context: any, response: R, error: T, meta?: any)
}

export interface UserHeaderProcessor<E extends LambdaProxyEvent, C extends Context> {
	process(event: E, context?: C, logger?)
}
