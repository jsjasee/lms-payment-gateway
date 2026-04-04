import mongoose from "mongoose";

const MAX_RETRIES = 3;
const RETRY_INTERVAL = 5000; // 5 seconds - this is mentioned in the mongoose docs

class DatabaseConnection {
  constructor() {
    this.retryCount = 0;
    this.isConnected = false;

    // configure mongoose settings
    mongoose.set("strictQuery", true); // strictQuery set to true, that means if we query for a field that is not mentioned in our models, mongoose will silently strip away those fields that is not existing in our model and just query for those remaining fields

    // configure mongoose connection
    mongoose.connection.on("connected", () => {
      console.log("✅MONGODB connected successfully.");
      this.isConnected = true;
    });
    mongoose.connection.on("error", () => {
      console.log("❌MONGODB connection errored.");
      this.isConnected = false;
    });
    mongoose.connection.on("disconnected", () => {
      console.log("🫤MONGODB disconnected.");
      this.isConnected = false;
      // todo: Attempt a reconnection
      this.handleDisconnection(); // no need to use await here? because it is a constructor.
    });

    process.on("SIGTERM", this.handleAppTermination.bind(this)); // what is SIGTERM? then the .bind() is to attach the context to that, because the constructor don't have context like which object is calling it! use this when we are in the constructor and use the method outside of constructor.
    // bind call apply -> must know
  }

  async connect() {
    try {
      if (!process.env.MONGO_URI) {
        throw new Error("MONGO db URI is not defined in env variables");
      }

      // can optionally set up connection options
      const connectionOptions = {
        maxPoolSize: 10, // 10 connections in a connection pool, in free plan i think?
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      if (process.env.NODE_ENV === "development") {
        mongoose.set("debug", true); // the stats will be more detailed
      }

      await mongoose.connect(
        `${process.env.MONGO_URI}${process.env.DB_NAME}`,
        connectionOptions,
      );
      this.retryCount = 0; // reset retry count to 0 if successful
    } catch (error) {
      console.error(error.message);
      await this.handleConnectionError();
    }
  }

  // if the connection fails
  async handleConnectionError() {
    if (this.retryCount < MAX_RETRIES) {
      this.retryCount++;
      console.log(
        `Retrying connection... ATTEMPT ${this.retryCount} of ${MAX_RETRIES}`,
      );
      // wait for the 5s interval (this promise will also resolve)
      await new Promise((resolve) =>
        setTimeout(() => {
          resolve(); // after 5s it will resolve... this promise don't need to do anything
        }, RETRY_INTERVAL),
      );
      return this.connect();
    } else {
      console.error(
        `Failed to connect to MONGODB after ${MAX_RETRIES} attemps`,
      );
      process.exit(1); // nodejs code
    }
  }

  // if connection disconnects
  async handleDisconnection() {
    if (!this.isConnected) {
      console.log("Attempting to reconnect to mongodb....");
      this.connect();
    }
  }

  // if connection somehow closes (NAME IT handleAppTermination - this is a production naming convention)
  async handleAppTermination() {
    try {
      await mongoose.connection.close(); // don't want the connection pool to hang around
      console.log("MongoDB connection closes through app termination");
      process.exit(0);
    } catch (error) {
      console.error("Error during database disconnection", error);
      process.exit(1);
    }
  }

  // useful method
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      name: mongoose.connection.user,
    };
  }
}

// Create a singleton instance

const dbConnection = new DatabaseConnection(); // we use the SAME object, instead of creating multiple objects if you export default dbConnection.connect()??

export default dbConnection.connect.bind(dbConnection); // we pass the SAME object
export const getDBStatus = dbConnection.getConnectionStatus.bind(dbConnection);
