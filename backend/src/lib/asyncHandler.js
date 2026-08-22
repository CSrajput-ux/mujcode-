import { sendJson } from './http.js';

/**
 * Enterprise Async Route Handler Wrapper
 * 
 * Automatically catches any unhandled exceptions in asynchronous route handlers
 * and forwards them to a standardized error response, eliminating the need
 * for redundant try/catch blocks in every route.
 * 
 * Usage:
 * router.get('/route', asyncHandler(async (req, res, ctx) => {
 *   // ... code without try/catch
 * }));
 */
export const asyncHandler = (fn) => async (req, res, ctx) => {
  try {
    await fn(req, res, ctx);
  } catch (error) {
    console.error(`[RouteError] ${req.method} ${req.url}:`, error);

    const statusCode = error.status || error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    // If response headers are already sent, we can't send JSON. 
    // Just end the response to prevent a hanging request.
    if (res.headersSent) {
      console.warn('[RouteError] Headers already sent, closing connection.');
      return res.end();
    }

    sendJson(res, statusCode, {
      success: false,
      error: message,
      ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
    });
  }
};
