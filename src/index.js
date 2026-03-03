import dns from "node:dns/promises";
dns.setServers(["1.1.1.1", "8.8.8.8"]);
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";

// Load environment variables
dotenv.config({ path: './.env' });

// Execute the connection
connectDB()
    .then(() => {
        console.log("Database connection successful!");
        app.listen(process.env.PORT || 8000 , ()=>{
            console.log(`server is running at PORT : ${process.env.PORT}`)
        })
    })
    .catch((err) => {
        console.log("Database connection failed!", err);
});