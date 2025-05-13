import express from 'express';
import { createFolder,getFolders  } from '../controllers/folderController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';

const router = express.Router();

router.post('/', verifyFirebaseToken, createFolder);
router.get('/', verifyFirebaseToken, getFolders);
export default router;
