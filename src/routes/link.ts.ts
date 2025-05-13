import express from 'express';
import { createLink } from '../controllers/linkController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';

const router = express.Router();

router.post('/', verifyFirebaseToken, createLink);

export default router;
