import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/tokens.js";
import { prisma } from "../lib/prisma.js";

type Role = "USER" | "ADMIN";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
        res.status(401).json({ error: "Missing access token" });
        return;
    }

    try {
        res.locals.userId = verifyAccessToken(header.slice("Bearer ".length));
    } catch {
        res.status(401).json({ error: "Invalid or expired access token" });
        return;
    }

    next();
}

export function requireRole(...roles: Role[]) {
    return async (_req: Request, res: Response, next: NextFunction) => {
        const user = await prisma.user.findUnique({
            where: { id: res.locals.userId },
            select: { role: true },
        });

        if (!user || !roles.includes(user.role)) {
            res.status(403).json({ error: "Forbidden" });
            return;
        }
        next();
    };
}