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


export const getFolders = async (req: AuthRequest, res: Response) => {
  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.uid },
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // 1. 내가 만든 폴더
    const ownedFolders = await prisma.folder.findMany({
      where: { ownerId: user.id }
    });

    // 2. 공유받은 폴더
    const sharedFolders = await prisma.folder.findMany({
      where: {
        shares: {
          some: {
            userId: user.id
          }
        }
      }
    });

    // 3. 통합 + isOwner 플래그 붙이기
    const response = [
      ...ownedFolders.map(f => ({ ...f, isOwner: true })),
      ...sharedFolders.map(f => ({ ...f, isOwner: false }))
    ];

    res.json(response);

  } catch (err) {
    console.error('❌ 폴더 조회 에러:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
