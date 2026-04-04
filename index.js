import { configDotenv } from "dotenv";
import morgan from "morgan";
import express from "express";

configDotenv(); // our .env path is in the root of the home folder, so no additional config needed.

const app = express();
const PORT = process.env.PORT;

// middleware for logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev")); // app.use() injects the middleware but its injected everywhere, we need to specify to use morgon only in development, thats why we add the process.env check
  // can also configure morgan to save our logs into a file
}

// Body parser middleware
app.use(express.json({ limit: "10kb" })); // we are accepting json files but limiting size to 10kb
app.use(express.urlencoded({ extended: true, limit: "10kb" })); // extended means use the latest version, urlencoded helps us convert spaces to %20

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack); // .stack gives the entire error
  res.status(err.status || 500).json({
    status: "error",
    message: err.message || "Internal server error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }), // only unwrap when it is in development, && means both need to be true in order to dump the entire stack.
  });
});

// API routes

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
