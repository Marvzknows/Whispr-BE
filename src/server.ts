import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config.js";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/user.js"
import { AppError } from "./utils/errors.js";

const app = express();

// CORS: allow ONE specific origin, and allow cookies to be sent with requests
app.use(
    cors({
        origin: config.clientOrigin,
        credentials: true,
    })
);

app.use(express.json());
app.use(cookieParser());

app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/api/users", userRoutes)

// Catches errors thrown in any (async) handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
        res.status(err.status).json({ error: err.message });
        return;
    }
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
});

app.listen(config.port, () => {
    console.log(`API running on http://localhost:${config.port}`);
});