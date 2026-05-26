import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import urlRoutes from "./routes/url";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/trimly";

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", urlRoutes);

// MongoDB Connection
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully");
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection error:", error);
  });