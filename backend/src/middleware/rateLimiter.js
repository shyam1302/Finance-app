// Extremely simple, low-dependency in-memory rate limiter for API endpoints
const requestCounts = {};
setInterval(() => {
  for (const ip in requestCounts) {
    if (Date.now() - requestCounts[ip].firstRequest > 60000) {
      delete requestCounts[ip];
    }
  }
}, 60000); // clear memory every minute

export const rateLimiter = (limit = 100) => {
  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!requestCounts[ip]) {
      requestCounts[ip] = { count: 1, firstRequest: Date.now() };
      return next();
    }
    
    if (Date.now() - requestCounts[ip].firstRequest > 60000) {
      // Reset window
      requestCounts[ip] = { count: 1, firstRequest: Date.now() };
      return next();
    }
    
    requestCounts[ip].count++;
    
    if (requestCounts[ip].count > limit) {
      return res.status(429).json({
        success: false,
        error: 'Too many requests, please try again after a minute.'
      });
    }
    
    next();
  };
};
