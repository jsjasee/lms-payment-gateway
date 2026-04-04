import { configDotenv } from "dotenv";
import express from "express";

configDotenv(); // our .env path is in the root of the home folder, so no additional config needed.

const app = express();
const PORT = process.env.PORT;

// Listen to the port
app.listen(PORT, () => {
  console.log(`Server is running at ${PORT} in ${process.env.NODE_ENV} mode`);
});
