const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const contestRoutes = require("./routes/contestRoutes");
const problemRoutes = require("./routes/problemRoutes");

dotenv.config();
//console.log("MONGO_URI:", process.env.MONGO_URI);
connectDB();

const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/contests", contestRoutes);
app.use("/api/problems", problemRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
