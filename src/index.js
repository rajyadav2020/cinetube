import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import dotenv from "dotenv";
import connectDB from "./db/index.js";

// Load environment variables
dotenv.config({ path: './.env' });

// Execute the connection
connectDB()
    .then(() => {
        console.log("Database connection successful!");
        // Start your express server here (app.listen)
    })
    .catch((err) => {
        console.log("Database connection failed!", err);
    });