import { configDotenv } from "dotenv";
configDotenv(); // Load env variables early
console.log("Loaded MONGODB_URI:", process.env.MONGODB_URI);

import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import familyRoutes from "./routes/family.route.js";
import shareRoutes from "./routes/share.route.js";
import collaborationRoutes from "./routes/collaboration.route.js";
import albumRoutes from "./routes/album.route.js";
import familyGroupRoutes from "./routes/familyGroup.route.js"
import analyticsRoutes from "./routes/analytics.route.js";
import userRoutes from "./routes/user.route.js";


const app = express();
const PORT = process.env.PORT || 5001;
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : ["https://famjam-blond.vercel.app"];

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(cookieParser());
app.use(
  cors({
    origin:process.env.FRONTEND_URL||"https://famjam-blond.vercel.app" ,
    credentials: true,
  })
);

// Add logging middleware
app.use((req, res, next) => {
    console.log(`Incoming Request: ${req.method} ${req.url}`);
    next();
});

// API routes - all prefixed with /api
app.use("/api/auth", authRoutes);
app.use("/api/family", familyRoutes);
app.use("/api/share", shareRoutes);
app.use("/api/collaboration", collaborationRoutes);
app.use("/api/albums", albumRoutes);
app.use('/api/family-groups', familyGroupRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use("/api/users",userRoutes);

// The backend should not serve any frontend files.
// All code related to serving index.html for any route should be removed.
// The public share route logic will be handled by the frontend.


app.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});