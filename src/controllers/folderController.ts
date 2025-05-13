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
  console.log('✅ UID:', req.uid);
  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.uid },
    });
    if (!user) {
      console.log('✅ 404UID:', req.uid);
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

export const shareFolder = async (req: AuthRequest, res: Response) => {
  const folderId = req.params.id;
  const { email } = req.body;

  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const owner = await prisma.user.findUnique({ where: { firebaseUid: req.uid } });
    if (!owner) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const folder = await prisma.folder.findUnique({
      where: { id: folderId },
    });

    if (!folder || folder.ownerId !== owner.id) {
      res.status(403).json({ error: 'You are not the owner of this folder' });
      return;
    }

    const targetUser = await prisma.user.findUnique({ where: { email } });
    if (!targetUser) {
      res.status(404).json({ error: 'Target user not found' });
      return;
    }

    // 이미 공유돼있는지 체크
    const alreadyShared = await prisma.userFolderShare.findUnique({
      where: {
        userId_folderId: {
          userId: targetUser.id,
          folderId: folder.id,
        }
      }
    });

    if (alreadyShared) {
      res.status(400).json({ error: 'This folder is already shared with that user' });
      return;
    }

    await prisma.userFolderShare.create({
      data: {
        userId: targetUser.id,
        folderId: folder.id,
      },
    });

    res.json({ message: `폴더가 ${email} 사용자에게 공유되었습니다.` });

  } catch (err) {
    console.error('❌ 폴더 공유 에러:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
