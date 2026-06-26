const RateLimit = require("../models/RateLimit");
const { resolveUserFromAccessToken } = require("../services/authSession");

// In-memory store for IP-based rate limiting (DDoS & Brute Force mitigation)
const ipRequests = new Map();

// Periodic cleanup of the in-memory IP store to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of ipRequests.entries()) {
    if (now - data.windowStart > 15 * 60 * 1000) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

/**
 * Middleware for IP-based rate limiting.
 * @param {number} limit - Maximum number of requests allowed in the window.
 * @param {number} windowMs - Time window in milliseconds (defaults to 15 minutes).
 */
const ipRateLimiter = (limit, windowMs = 15 * 60 * 1000) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const now = Date.now();

    if (!ipRequests.has(ip)) {
      ipRequests.set(ip, { count: 1, windowStart: now });
      return next();
    }

    const data = ipRequests.get(ip);
    if (now - data.windowStart > windowMs) {
      data.count = 1;
      data.windowStart = now;
      return next();
    }

    data.count += 1;
    if (data.count > limit) {
      return res.status(429).json({
        message: "Too many requests from this IP. Please try again later.",
      });
    }

    next();
  };
};

/**
 * Middleware for User-based rolling-window rate limiting stored in MongoDB.
 * @param {string} action - Action name ('ai_review' or 'code_run').
 * @param {number} hourlyLimit - Max requests per hour.
 * @param {number} dailyLimit - Max requests per day.
 */
const checkRateLimit = (action, hourlyLimit, dailyLimit) => {
  return async (req, res, next) => {
    try {
      const user = await resolveUserFromAccessToken(req);
      if (!user) {
        return res.status(401).json({ message: "Please sign in to continue." });
      }

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Find or initialize the user's rate limit document for this specific action
      let limitDoc = await RateLimit.findOne({ userId: user._id, action });
      if (!limitDoc) {
        limitDoc = new RateLimit({ userId: user._id, action, timestamps: [] });
      }

      // Filter out timestamps older than 24 hours to keep the array clean
      limitDoc.timestamps = limitDoc.timestamps.filter((ts) => ts >= oneDayAgo);

      // Calculate counts
      const hourlyCount = limitDoc.timestamps.filter((ts) => ts >= oneHourAgo).length;
      const dailyCount = limitDoc.timestamps.length;

      if (hourlyCount >= hourlyLimit) {
        return res.status(429).json({
          message: `Rate limit exceeded. You can only perform this action ${hourlyLimit} times per hour.`,
        });
      }

      if (dailyCount >= dailyLimit) {
        return res.status(429).json({
          message: `Rate limit exceeded. You can only perform this action ${dailyLimit} times per day.`,
        });
      }

      // Add new timestamp and save
      limitDoc.timestamps.push(now);
      await limitDoc.save();

      next();
    } catch (error) {
      console.error(`Rate limiting error for ${action}:`, error);
      // Fail-open: allow request to proceed if there is an internal rate limiter database error
      next();
    }
  };
};

module.exports = {
  ipRateLimiter,
  checkRateLimit,
};
