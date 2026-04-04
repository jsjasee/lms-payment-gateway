import { configDotenv } from "dotenv";
import morgan from "morgan";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import ExpressMongoSanitize from "express-mongo-sanitize";
import hpp from "hpp";
import cookieParser from "cookie-parser";
import cors from "cors";
import healthRoute from "./routes/health.route";

configDotenv(); // our .env path is in the root of the home folder, so no additional config needed.

const app = express();
const PORT = process.env.PORT;

// security - global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  message: "Too many requests from this IP, please try later.",
  standardHeaders: "draft-8", // draft-6: `RateLimit-*` headers; draft-7 & draft-8: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  ipv6Subnet: 56, // Set to 60 or 64 to be less aggressive, or 52 or 48 to be more aggressive
  // store: ... , // Redis, Memcached, etc. See below.
});

// middleware for security (but only apply it for those routes that starts with /api)
app.use("/api", limiter);
app.use(ExpressMongoSanitize());
app.use(hpp());
app.use(helmet()); // this one secure Express apps by setting HTTP response headers

// middleware for logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // app.use() injects the middleware but its injected everywhere, we need to specify to use morgon only in development, thats why we add the process.env check
  // can also configure morgan to save our logs into a file
}

// Body parser middleware
app.use(express.json({ limit: "10kb" })); // we are accepting json files but limiting size to 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // extended means use the latest version, urlencoded helps us convert spaces to %20
app.use(cookieParser());

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // .stack gives the entire error
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // only unwrap when it is in development, && means both need to be true in order to dump the entire stack.
  });
});

// CORS configuration
// app.use(cors()) ❌
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173", // "*" ❌ this * means accept req from every origin.. dangerous
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"], // what requests can frontend send us
    allowedHeaders: [
      "Authorization",
      "Content-Type",
      "X-Requested-With",
      "device-remember-token",
      "Access-Control-Allow-Origin",
      "Origin",
      "Accept",
    ],
  }),
);

// API routes
app.use("/api/v1/healthcheck", healthRoute);

// 404 handler should always be at the bottom (because express match routes from top to bottom)
app.use((req, res) => {
  res.status(404).json({
    status: "error",
    message: "Route not found",
  });
});

// Listen to the port
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV} mode`);
});
