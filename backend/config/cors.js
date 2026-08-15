const LOCAL_DEVELOPMENT_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const normaliseOrigin = (value) => {
  try {
    return new URL(value.trim()).origin;
  } catch {
    throw new Error(`Invalid CORS origin: ${value}`);
  }
};

const getAllowedOrigins = (env = process.env) => {
  const configuredOrigins = env.CLIENT_URLS || env.CLIENT_URL;

  if (!configuredOrigins) {
    return new Set(LOCAL_DEVELOPMENT_ORIGINS);
  }

  return new Set(
    configuredOrigins
      .split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
      .map(normaliseOrigin)
  );
};

const createCorsOptions = (env = process.env) => {
  const allowedOrigins = getAllowedOrigins(env);

  return {
    origin: (origin, callback) => {
      // Requests without an Origin header (Render health checks, curl, server-to-server)
      // are not browser CORS requests and may access the public API.
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }

      const error = new Error("Request origin is not allowed by CORS.");
      error.status = 403;
      return callback(error);
    },
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  };
};

module.exports = { createCorsOptions, getAllowedOrigins };
