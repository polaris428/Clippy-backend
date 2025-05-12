import express from 'express';
import { login } from '../controllers/authController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';

const router = express.Router();

router.post('/login', verifyFirebaseToken, login);

export default router;