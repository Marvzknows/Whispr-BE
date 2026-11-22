import type { Request, Response } from "express";
import type { UserService } from "../services/user.service.js";
import { AppError } from "../utils/errors.js";

export class UserController {
    private readonly userService: UserService;

    constructor(userService: UserService) {
        this.userService = userService;
    }

    searchByEmail = async (req: Request, res: Response) => {
        const { email } = req.query;

        if (typeof email !== "string") {
            throw new AppError(400, "email query parameter is required");
        }

        const user = await this.userService.findByEmail(email, res.locals.userId);
        res.json({ user });
    };
}