import express from 'express';
import { createFolder } from '../controllers/folderController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';

const router = express.Router();

router.post('/', verifyFirebaseToken, createFolder);

export default router;
