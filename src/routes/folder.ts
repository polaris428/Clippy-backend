import express from 'express';
import { createFolder,getFolders  } from '../controllers/folderController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';
import { createOnboardingFolder } from '../controllers/onboardingController';
const router = express.Router();
router.get('/ping', (_, res) => {
  res.send('pong from folder route!');
});
router.post('/', verifyFirebaseToken, createFolder);
router.get('/', verifyFirebaseToken, getFolders);
router.post('/onboarding', verifyFirebaseToken, createOnboardingFolder);
export default router;
