import { ZodError } from 'zod';
import { HttpError } from '../utils/http-error.js';
import { config } from '../config/env.js';

const send = (res, status, code, message, details) => {
  const error = { code, message };
  if (details !== undefined) error.details = details;
  res.status(status).json({ error });
};

export function notFoundHandler(req, res) {
  send(res, 404, 'NOT_FOUND', `No route for ${req.method} ${req.originalUrl}`);
}

export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return send(res, err.status, err.code, err.message, err.details);
  }
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    return send(res, 400, 'VALIDATION_ERROR', 'Request validation failed', details);
  }
  if (err?.name === 'CastError') {
    return send(res, 400, 'INVALID_ID', `Invalid value for ${err.path}`);
  }
  if (err?.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0] ?? 'field';
    return send(res, 409, 'DUPLICATE', `A record with that ${field} already exists`, {
      field,
    });
  }
  if (err?.type === 'entity.parse.failed') {
    return send(res, 400, 'INVALID_JSON', 'Request body is not valid JSON');
  }
  if (err?.message === 'CORS_ORIGIN_DENIED') {
    return send(res, 403, 'CORS_ORIGIN_DENIED', 'Origin not allowed');
  }
  if (!config.isTest) console.error(err);
  return send(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
}
