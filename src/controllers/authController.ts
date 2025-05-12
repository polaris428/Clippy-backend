import { Response } from 'express';
import { AuthRequest } from '../middlewares/firebaseAuth';
import { prisma } from '../prisma/client';

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  if (!req.email) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  console.log(req.email)
  try {

    const user = await prisma.user.upsert({
      where: { firebaseUid: req.uid },
      update: {},
      create: {
        firebaseUid: req.uid,
        email: req.email,    
        },
    });

    res.status(200).json({ userId: user.id });
  } catch (error) {
    console.error('❌ Login error:', error); 
    res.status(500).json({ error: 'Login failed' });
  }
};


