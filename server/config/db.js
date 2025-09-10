import mongoose from "mongoose";

const connectDB = async () => {
    try {
        if (!process.env.MONGODB_URL) {
            throw new Error("MongoDB URL is not defined in .env file");
        }

        // Set up connection event listeners
        mongoose.connection.on("connected", () => {
            console.log("MongoDB connected successfully");
        });

        mongoose.connection.on("error", (err) => {
            console.error("MongoDB connection error:", err);
        });

        mongoose.connection.on("disconnected", () => {
            // MongoDB disconnected
        });

        // Attempt to connect
        await mongoose.connect(process.env.MONGODB_URL);
        
        // Verify connection is active
        if (mongoose.connection.readyState === 1) {
            return true;
        } else {
            throw new Error("Database connection not ready");
        }

    } catch (err) {
        console.error("Critical error while connecting to DB:", err.message);
        process.exit(1); // Exit the process if DB connection fails
    }
};

export default connectDB;
