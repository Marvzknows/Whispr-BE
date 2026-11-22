import type { UserRepository } from "../repositories/user.repository.js";
import { AppError } from "../utils/errors.js";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UserService {
    constructor(private readonly users: UserRepository) { }

    async findByEmail(rawEmail: string, me: string) {
        const email = rawEmail.trim().toLowerCase();
        if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
            throw new AppError(400, "Please enter a valid email address");
        }

        const user = await this.users.findByEmail(email)
        if (!user || user.id === me) return null;

        return user;
    }
}