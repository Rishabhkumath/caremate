const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");

dotenv.config();

/* CONFIG */
const connectDB = require("./config/db");
const corsOptions = require("./config/corsOptions");

/* MIDDLEWARE */
const errorHandler = require("./middleware/errorHandler");
const { logger, errorLogger } = require("./middleware/logger");
const { apiLimiter } = require("./middleware/rateLimiter");

/* ROUTES */
const routes = require("./routes");

/* SERVICES */
const reminderScheduler = require("./services/reminderScheduler");
const notificationService = require("./services/notificationService");

/* CONNECT DATABASE */
connectDB();

const app = express();

/* ================= SECURITY ================= */

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

app.use(cors(corsOptions));

/* ================= BODY PARSER ================= */

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

/* ================= LOGGING ================= */

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(logger);

/* ================= RATE LIMITER ================= */

app.use("/api/v1", apiLimiter);

/* ================= HEALTH CHECK ================= */

app.get("/api/v1/health", (req, res) => {
  res.json({
    status: "OK",
    message: "CareMate API running",
    build: "carework-save-fix",
    timestamp: new Date().toISOString(),
    database:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

/* ================= API ROUTES ================= */

app.use("/api/v1", routes);

/* ================= 404 ================= */

app.use("*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `Cannot find ${req.originalUrl}`,
  });
});

/* ================= ERROR HANDLING ================= */

app.use(errorLogger);
app.use(errorHandler);

/* ================= SERVICES ================= */

reminderScheduler.initialize();

app.set("reminderScheduler", reminderScheduler);
app.set("notificationService", notificationService);

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`
==================================================
CareMate Backend Server Running
==================================================
PORT: ${PORT}
ENV: ${process.env.NODE_ENV || "development"}
DATABASE: ${
    mongoose.connection.readyState === 1 ? "Connected" : "Disconnected"
  }
==================================================
`);
});

/* HANDLE PORT ALREADY IN USE */

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${PORT} is already in use.`);
    console.log("Try running: npx kill-port 5000");
    process.exit(1);
  } else {
    console.error("Server error:", error);
  }
});

module.exports = app;
