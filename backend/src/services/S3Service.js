import { logger } from "../lib/logger.js";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

/**
 * S3Service — local dev fallback.
 * In production (AWS_S3_BUCKET_NAME set), use real S3.
 * In local dev, save to uploads/ folder and return a localhost URL.
 */
export class S3Service {
  static async uploadFile(buffer, filename, contentType) {
    const isProduction = !!process.env.AWS_S3_BUCKET_NAME;

    if (isProduction) {
      // Lazy-load AWS SDK only when actually needed
      const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
      const s3 = new S3Client({ region: process.env.AWS_REGION || "us-east-1" });
      const bucket = process.env.AWS_S3_BUCKET_NAME;
      await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: `uploads/${filename}`,
        Body: buffer,
        ContentType: contentType,
      }));
      const url = `https://${bucket}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/uploads/${filename}`;
      logger.info(`[S3Service] Uploaded to S3: ${url}`);
      return url;
    }

    // LOCAL DEV: save to uploads/ directory
    const uploadDir = config.uploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    const url = `http://localhost:${config.port}/uploads/${filename}`;
    logger.info(`[S3Service] Saved locally: ${url}`);
    return url;
  }
}
