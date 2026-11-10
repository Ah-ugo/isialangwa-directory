import { ZodError } from 'zod';

export const notFound = (req, res) => res.status(404).json({ success: false, message: 'Route not found' });

export function errorHandler(err, req, res, next) {
  let status = err.status || err.statusCode || 500;
  let message = err.message;
  let extra = err.extra || {};
  if (err instanceof ZodError) {
    status = 400;
    message = err.issues[0]?.message || 'Please check the form and try again';
    extra = { errors: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) };
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier';
  } else if (err.name === 'ValidationError') {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  } else if (err.code === 11000) {
    status = 409;
    message = 'That name or code already exists';
  } else if (status >= 500 || !err.status) {
    if (status >= 500) console.error(err);
    if (!err.status && !err.statusCode) { status = 500; message = 'Something went wrong. Please try again.'; }
    else if (status >= 500) message = 'Something went wrong. Please try again.';
  }
  res.status(status).json({ success: false, message, ...extra });
}
