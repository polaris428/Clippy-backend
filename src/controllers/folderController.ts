import { Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/firebaseAuth';

export const createFolder = async (req: AuthRequest, res: Response) => {
  const { name } = req.body;

  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const folder = await prisma.folder.create({
      data: {
        name,
        ownerId: user.id
      }
    });

    res.status(201).json(folder);

  } catch (err) {
    console.error('❌ 폴더 생성 에러:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
