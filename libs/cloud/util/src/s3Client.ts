// @ts-strict-ignore
import * as sdkClientS3 from '@aws-sdk/client-s3'
import { NodeHttpHandler } from '@aws-sdk/node-http-handler'
import { HeadObjectOutput, GetObjectOutput, ListObjectsOutput, PutObjectOutput } from '@aws-sdk/client-s3'
import { Logger } from 'winston'

export class S3Client {
	logger: Logger
	s3Client: sdkClientS3.S3Client

	constructor(logger: Logger) {
		this.logger = logger
		this.s3Client = new sdkClientS3.S3Client({
			requestHandler: new NodeHttpHandler({
				connectionTimeout: 4 * 1000,
				socketTimeout: 4 * 1000,
			}), // aws sdk v3 ONLY supports signature v4
		})
	}

	async delete(bucketName: string, key: string) {
		try {
			this.logger.debug(`Key - ${key}`)
			const headObject: HeadObjectOutput = await this.s3Client.send(
				new sdkClientS3.HeadObjectCommand({
					Bucket: bucketName,
					Key: key,
				}),
			)
			if (headObject?.Metadata) {
				const s3Object: GetObjectOutput = await this.s3Client.send(
					new sdkClientS3.DeleteObjectCommand({
						Bucket: bucketName,
						Key: key,
					}),
				)
				this.logger.debug('delete successful', s3Object)
				return true
			}
			this.logger.info('S3 file is not existed')
			return false
		} catch (err) {
			this.logger.error(err)
			this.logger.error(`Failed to load verisk s3 object ${key} with error`)
			return false
		}
	}

	async get(bucketName: string, key: string) {
		try {
			this.logger.debug(`Key - ${key}`)
			const headObject: HeadObjectOutput = await this.s3Client.send(
				new sdkClientS3.HeadObjectCommand({
					Bucket: bucketName,
					Key: key,
				}),
			)
			this.logger.debug(`headObject?.Metadata?.respondedat - ${headObject?.Metadata?.respondedat}`)
			if (headObject?.Metadata?.respondedat) {
				const s3Object: GetObjectOutput = await this.s3Client.send(
					new sdkClientS3.GetObjectCommand({
						Bucket: bucketName,
						Key: key,
					}),
				)
				this.logger.debug('File loaded', s3Object)
				if (s3Object?.Body) {
					return {
						lastModified: headObject?.Metadata?.respondedat,
						data: s3Object.Body,
					}
				}
				return null
			}
			this.logger.warn(`File ${bucketName}_${key} not loaded`)
			return null
		} catch (err) {
			this.logger.error(err)
			this.logger.error(`Failed to load verisk s3 object ${key} with error`)
			return null
		}
	}

	async listObjects(bucketName: string, queryKey: string) {
		const listObjects: ListObjectsOutput = await this.s3Client.send(
			new sdkClientS3.ListObjectsCommand({
				Bucket: bucketName,
				Prefix: `${queryKey}`,
			}),
		)
		this.logger.info('listObjects', { data: listObjects })
		const latestKey = listObjects.Contents?.sort((a, b) => {
			return new Date(b.LastModified || '').getTime() - new Date(a.LastModified || '').getTime()
		})?.[0]?.Key
		if (latestKey) {
			this.logger.info('using existing cache:' + latestKey)
			const cache: any = await this.get(bucketName, latestKey)
			return cache
		}
		return null
	}

	async save(bucketName: string, key: string, data: any, contentType?: string) {
		try {
			const valueKey = `${key}`
			this.logger.debug(`save S3 ${bucketName} Key - ${valueKey}`)
			const putObjectResponse: PutObjectOutput = await this.s3Client.send(
				new sdkClientS3.PutObjectCommand({
					Bucket: bucketName,
					Key: valueKey,
					Body: data,
					Metadata: { respondedAt: new Date().toISOString(), ContentType: contentType },
				}),
			)
			this.logger.debug('putObjectResponse', putObjectResponse)
			return true
		} catch (err) {
			this.logger.error(err)
			this.logger.error(`Failed to save s3 ${bucketName} object ${key} with error`)
			return false
		}
	}
}
