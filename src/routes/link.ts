import express from 'express';
import { createLink ,getLinks} from '../controllers/linkController';
import { verifyFirebaseToken } from '../middlewares/firebaseAuth';

const router = express.Router();

router.post('/', verifyFirebaseToken, createLink);
router.get('/', verifyFirebaseToken, getLinks);
export default router;
