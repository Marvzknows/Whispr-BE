import { UserRepository } from "./repositories/user.repository.js";
import { UserService } from "./services/user.service.js";
import { UserController } from "./controllers/user.controller.js";

// Repositories
const userRepository = new UserRepository()

// Services
const userService = new UserService(userRepository)

// Controllers
export const userController = new UserController(userService)