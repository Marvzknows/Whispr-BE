import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/tokens.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing access token" });
        return;
    }

    try {
        res.locals.userId = verifyAccessToken(header.slice("Bearer ".length));
        next();
    } catch {
        res.status(401).json({ error: "Invalid or expired access token" });
    }
}