import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { config } from "../config.js";

export function signAccessToken(userId: string): string {
    return jwt.sign({ sub: userId }, config.jwtAccessSecret, {
        algorithm: "HS256",
        expiresIn: config.accessTokenTtlSeconds,
    });
}

export function verifyAccessToken(token: string): string {
    const payload = jwt.verify(token, config.jwtAccessSecret, {
        algorithms: ["HS256"],
    });
    if (typeof payload === "string" || !payload.sub) {
        throw new Error("Invalid token payload");
    }
    return payload.sub;
}

// We store only the hash in the DB; the raw token only ever lives in the cookie.
export function hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateRefreshToken() {
    const token = crypto.randomBytes(48).toString("hex");
    return {
        token,
        tokenHash: hashToken(token),
        expiresAt: new Date(Date.now() + config.refreshTokenDays * 24 * 60 * 60 * 1000),
    };
}