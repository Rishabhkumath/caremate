/**
 * Custom error types for better error handling
 */

class APIError extends Error {
  constructor(message, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.name = 'APIError';
  }
}

class AIError extends Error {
  constructor(message, serviceError = null) {
    super(message);
    this.name = 'AIError';
    this.serviceError = serviceError;
  }
}

class ValidationError extends Error {
  constructor(message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

module.exports = {
  APIError,
  AIError,
  ValidationError
};