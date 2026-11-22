import { prisma } from "../lib/prisma.js";
import { publicUserSelect } from "../lib/select.js";

export class UserRepository {

    findByEmail(email: string) {
        return prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: publicUserSelect,
        })
    }

}