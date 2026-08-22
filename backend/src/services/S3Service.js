import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { logger } from "../lib/logger.js";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  // Ensure the EC2 instances/Pods have an attached IAM role with s3:PutObject permissions
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "mujcode-enterprise-uploads";

export class S3Service {
  /**
   * Uploads a file buffer directly to Amazon S3.
   * @param {Buffer} buffer - The binary content of the file.
   * @param {string} filename - The target filename/key in S3.
   * @param {string} contentType - The MIME type of the file.
   * @returns {string} - The public S3 URL.
   */
  static async uploadFile(buffer, filename, contentType) {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `uploads/${filename}`,
      Body: buffer,
      ContentType: contentType,
    };

    try {
      const command = new PutObjectCommand(params);
      await s3Client.send(command);
      
      const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/uploads/${filename}`;
      logger.info(`[S3Service] Successfully uploaded to ${fileUrl}`);
      
      return fileUrl;
    } catch (error) {
      logger.error(`[S3Service] Failed to upload ${filename} to S3`, error);
      throw error;
    }
  }
}
