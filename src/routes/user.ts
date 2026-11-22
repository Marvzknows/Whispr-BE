import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { userController } from "../container.js";

const router = Router()

router.get("/search", requireAuth, userController.searchByEmail)

export default router