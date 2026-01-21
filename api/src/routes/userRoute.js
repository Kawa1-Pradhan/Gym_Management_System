import express from "express";
import userController from "../controllers/userController.js";
import auth from "../middlewares/auth.js";


const router = express.Router();

router.post("/", userController.createUser);

router.get("/",auth, userController.getUsers);

router.get("/:id",auth, userController.getUserById);

router.put("/:id",auth, userController.updateUser);

router.delete("/:id",auth, userController.deleteUser);

export default router;