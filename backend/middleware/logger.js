const morgan = require('morgan');

const logger = morgan((tokens, req, res) => {
  return [
    `[${new Date().toISOString()}]`,
    tokens.method(req, res),
    tokens.url(req, res),
    tokens.status(req, res),
    '-',
    tokens['response-time'](req, res), 'ms',
    '-',
    req.user ? `User: ${req.user._id}` : 'Unauthenticated'
  ].join(' ');
});

const errorLogger = (err, req, res, next) => {
  console.error({
    timestamp: new Date().toISOString(),
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user ? req.user._id : null,
    ip: req.ip
  });
  next(err);
};

module.exports = { logger, errorLogger };