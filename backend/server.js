const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const contestRoutes = require("./routes/contestRoutes");
const problemRoutes = require("./routes/problemRoutes");
const friendRoutes = require("./routes/friendRoutes");
const chatRoutes = require("./routes/chatRoutes");
const { ipRateLimiter } = require("./middleware/rateLimiter");

dotenv.config();
//console.log("MONGO_URI:", process.env.MONGO_URI);
connectDB();

const app = express();

// Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});

const allowedOrigins = [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Global IP rate limiter (1000 requests per 15 mins)
app.use(ipRateLimiter(1000));

app.get("/", (req, res) => {
  res.send("API Running");
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    features: {
      structuredProblems: true,
      problemEdit: true,
      problemDelete: true,
    },
  });
});

// Auth endpoints rate limited strictly (30 requests per 15 mins) to prevent brute forcing
app.use("/api/auth", ipRateLimiter(30), authRoutes);

app.use("/api/contests", contestRoutes);
app.use("/api/problems", problemRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/chat", chatRoutes);

// Centralized error handler to hide stack traces in production
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    message: err.message || "An unexpected error occurred.",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
