/** Error codes surfaced to the client. */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'AI_NOT_CONFIGURED'
  | 'AI_ERROR'
  | 'RATE_LIMITED'
  | 'INTERNAL';

export class ApiError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;

  constructor(statusCode: number, message: string, code: ErrorCode = 'INTERNAL', details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, message, 'BAD_REQUEST', details);
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(401, message, 'UNAUTHORIZED');
  }

  static forbidden(message = 'Forbidden'): ApiError {
    return new ApiError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found'): ApiError {
    return new ApiError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string): ApiError {
    return new ApiError(409, message, 'CONFLICT');
  }

  static aiNotConfigured(message = 'AI is not configured. Set AI_API_KEY (and AI_BASE_URL) in the backend environment.'): ApiError {
    return new ApiError(503, message, 'AI_NOT_CONFIGURED');
  }

  static aiError(message: string, details?: unknown): ApiError {
    return new ApiError(502, message, 'AI_ERROR', details);
  }

  static rateLimited(message = 'Too many requests, slow down.'): ApiError {
    return new ApiError(429, message, 'RATE_LIMITED');
  }
}
