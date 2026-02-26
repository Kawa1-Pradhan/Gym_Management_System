import express from 'express';
import authController from '../controllers/authController.js';

const router = express.Router();

//URL: /api/auth/register
// Registration is now handled through user management by staff/admin
// router.post("/register", authController.register);

router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.post("/contact", authController.contactUs);




export default router;