import { CloudinaryService } from "./CloudinaryService.js";

/**
 * S3Service — Maintained for backward compatibility.
 * Seamlessly routes all uploads through CloudinaryService.
 */
export class S3Service {
  static async uploadFile(buffer, filename, contentType) {
    return CloudinaryService.uploadFile(buffer, filename, contentType);
  }
}
