import S3 from 'aws-sdk/clients/s3'
import fs from 'fs/promises'
import { logger } from '../lib/logger'

export class StorageService {
  private static s3 = new S3({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
    s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
    signatureVersion: 'v4'
  })

  private static bucket = process.env.S3_BUCKET || 'beritakarya-kyc'

  /**
   * Upload a file to S3
   */
  static async uploadFile(localPath: string, remoteKey: string, contentType: string): Promise<string> {
    try {
      const fileBuffer = await fs.readFile(localPath)
      
      const params: S3.PutObjectRequest = {
        Bucket: this.bucket,
        Key: remoteKey,
        Body: fileBuffer,
        ContentType: contentType,
        // For KYC documents, we keep them private by default
        ACL: 'private'
      }

      const result = await this.s3.upload(params).promise()
      logger.info(`File uploaded to S3: ${remoteKey}`)
      return result.Key
    } catch (error) {
      logger.error(`Error uploading file to S3: ${error}`)
      throw error
    }
  }

  /**
   * Generate a signed URL for private file access
   */
  static async getSignedUrl(key: string, expiresSeconds: number = 3600): Promise<string> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: key,
        Expires: expiresSeconds
      }
      return this.s3.getSignedUrlPromise('getObject', params)
    } catch (error) {
      logger.error(`Error generating signed URL: ${error}`)
      throw error
    }
  }

  /**
   * Delete a file from S3
   */
  static async deleteFile(key: string): Promise<void> {
    try {
      await this.s3.deleteObject({
        Bucket: this.bucket,
        Key: key
      }).promise()
      logger.info(`File deleted from S3: ${key}`)
    } catch (error) {
      logger.error(`Error deleting file from S3: ${error}`)
    }
  }
}
