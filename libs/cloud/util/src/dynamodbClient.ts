// @ts-strict-ignore
import { DynamoDBClient as SdkDynamoDBClient } from '@aws-sdk/client-dynamodb'
import { Logger } from 'winston'
import {
	DeleteCommand,
	DynamoDBDocumentClient,
	GetCommand,
	NativeAttributeValue,
	PutCommand,
	QueryCommand,
	QueryCommandInput,
	ScanCommand,
	UpdateCommand,
	UpdateCommandInput,
} from '@aws-sdk/lib-dynamodb'

export class DynamoDBClient<T extends Record<string, NativeAttributeValue>> {
	private dynamoDb: DynamoDBDocumentClient

	constructor(private logger: Logger) {
		const marshallOptions = {
			// Whether to convert typeof object to map attribute.
			convertClassInstanceToMap: true, // false, by default
		}
		const unmarshallOptions = {}
		const translateConfig = { marshallOptions, unmarshallOptions }
		this.dynamoDb = DynamoDBDocumentClient.from(new SdkDynamoDBClient(), translateConfig)
	}

	async get(tableName: string, key: Partial<T> | undefined): Promise<T | null> {
		this.logger?.info(`get object from ${tableName} with primary key: ${JSON.stringify(key)}`)
		try {
			const result = await this.dynamoDb.send(
				new GetCommand({
					TableName: tableName,
					Key: key,
				}),
			)

			return (result.Item as T) || null
		} catch (error) {
			this.logger?.error('Error getting item:', error)
			throw error
		}
	}

	async delete(tableName: string, key: Partial<T> | undefined): Promise<void> {
		this.logger?.info(`delete object from ${tableName} with primary key: ${JSON.stringify(key)}`)
		try {
			await this.dynamoDb.send(
				new DeleteCommand({
					TableName: tableName,
					Key: key,
				}),
			)
		} catch (error) {
			this.logger?.error('Error deleting item:', error)
			throw error
		}
	}

	async put(tableName: string, item: T | undefined): Promise<void> {
		this.logger?.info(`PUT ${JSON.stringify(item)} into ${tableName}`)
		try {
			await this.dynamoDb.send(
				new PutCommand({
					TableName: tableName,
					Item: item,
				}),
			)
		} catch (error) {
			this.logger?.error('Error putting item:', error)
			throw error
		}
	}

	async query(tableName: string, params: QueryCommandInput): Promise<T[]> {
		this.logger?.info(`query  ${tableName} with conidtion`, params)
		try {
			const result = await this.dynamoDb.send(new QueryCommand(params))
			this.logger?.debug(`query result ${JSON.stringify(result)}`)
			return (result.Items as T[]) || []
		} catch (error) {
			this.logger?.error('Error querying items:', error)
			throw error
		}
	}

	async update(params: UpdateCommandInput): Promise<void> {
		this.logger?.info(`Update object in ${params.TableName} with primary key: ${params}`)
		try {
			await this.dynamoDb.send(new UpdateCommand(params))
		} catch (error) {
			this.logger?.error('Error updating item:', error)
			throw error
		}
	}

	async scan(tableName: string): Promise<T[]> {
		this.logger?.info(`scan  ${tableName}`)
		try {
			const params = {
				TableName: tableName,
				ExclusiveStartKey: undefined,
			}
			let result = []
			do {
				let items = await this.dynamoDb.send(new ScanCommand(params))
				items.Items?.forEach((item) => result.push(item))
				params.ExclusiveStartKey = items.LastEvaluatedKey
			} while (params.ExclusiveStartKey !== undefined)
			this.logger?.debug(`scan result ${JSON.stringify(result)}`)

			return result
		} catch (error) {
			this.logger?.error(`Error scan table ${tableName}`, error)
			throw error
		}
	}
}
