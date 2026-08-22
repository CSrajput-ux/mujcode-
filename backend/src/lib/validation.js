import { z } from 'zod';
import { sendJson } from './http.js';

/**
 * Validates a request body against a Zod schema.
 * If validation fails, returns a 400 Bad Request with the formatted errors
 * and returns false so the route handler can abort early.
 * 
 * Usage:
 * if (!validateSchema(req, res, mySchema)) return;
 * 
 * @param {Object} req Request object
 * @param {Object} res Response object
 * @param {z.ZodSchema} schema Zod schema to validate against
 * @returns {boolean} True if valid, false if invalid (response already sent)
 */
export function validateSchema(req, res, schema) {
  try {
    const data = schema.parse(req.body);
    // Replace req.body with the validated (and potentially transformed/stripped) data
    req.body = data;
    return true;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      sendJson(res, 400, {
        error: 'Validation failed',
        details: formattedErrors
      });
      return false;
    }
    
    sendJson(res, 500, { error: 'Internal server error during validation' });
    return false;
  }
}
