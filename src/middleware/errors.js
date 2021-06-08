import winston from 'winston';

module.exports = function(err, req, res, next){
  winston.error(err.message, err);

  // Dynamic setting of the HTTP status code.
  res.status(error.status)
  // And, then, send the response.
  res.json({ message: error.message })
}
