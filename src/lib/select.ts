import type { Prisma } from "../generated/prisma/client.js";

export const publicUserSelect = {
    id: true,
    fullName: true,
    avatarUrl: true,
} satisfies Prisma.UserSelect;