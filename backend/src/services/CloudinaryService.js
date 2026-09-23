import { v2 as cloudinary } from "cloudinary";
import { logger } from "../lib/logger.js";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config.js";

/**
 * CloudinaryService — Unified enterprise cloud storage for PPT, PDF, Images, Documents.
 * Automatically uploads to Cloudinary CDN when credentials are set in environment.
 * Falls back to local /uploads/ directory in offline local dev.
 */
export class CloudinaryService {
  static isConfigured() {
    return !!(
      process.env.CLOUDINARY_URL ||
      (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET)
    );
  }

  static getClient() {
    if (process.env.CLOUDINARY_URL) {
      cloudinary.config({
        cloudinary_url: process.env.CLOUDINARY_URL
      });
    } else if (process.env.CLOUDINARY_CLOUD_NAME) {
      cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
      });
    }
    return cloudinary;
  }

  /**
   * Upload file buffer to Cloudinary CDN
   * @param {Buffer} buffer - File buffer
   * @param {string} filename - Original or sanitized filename
   * @param {string} contentType - MIME type (e.g. application/pdf, image/png, application/vnd.ms-powerpoint)
   * @returns {Promise<string>} Secure Cloudinary CDN URL or local URL fallback
   */
  static async uploadFile(buffer, filename, contentType = "application/octet-stream") {
    if (this.isConfigured()) {
      const client = this.getClient();

      // Determine resource_type based on MIME type
      // Images -> "image", Videos -> "video", PDF / PPT / DOCX / ZIP / Others -> "raw"
      const isImage = contentType.startsWith("image/");
      const isVideo = contentType.startsWith("video/");
      let resourceType = "raw";
      if (isImage) resourceType = "image";
      else if (isVideo) resourceType = "video";

      const parsed = path.parse(filename);
      const safeBaseName = parsed.name.replace(/[^a-zA-Z0-9._-]/g, "_");

      return new Promise((resolve, reject) => {
        const uploadStream = client.uploader.upload_stream(
          {
            folder: "mujcode",
            resource_type: resourceType,
            public_id: `${Date.now()}_${safeBaseName}`,
            use_filename: true,
            unique_filename: true,
            overwrite: false
          },
          (error, result) => {
            if (error) {
              logger.error("[CloudinaryService] Upload failed:", error);
              return reject(new Error(error.message || "Cloudinary upload failed"));
            }
            logger.info(`[CloudinaryService] File uploaded successfully to CDN: ${result.secure_url}`);
            resolve(result.secure_url);
          }
        );

        uploadStream.end(buffer);
      });
    }

    // Local dev fallback: save to uploads/ directory
    const uploadDir = config.uploadDir;
    fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    const localUrl = `/uploads/${filename}`;
    logger.info(`[Storage] Cloudinary credentials not detected. Saved locally to: ${localUrl}`);
    return localUrl;
  }
}

