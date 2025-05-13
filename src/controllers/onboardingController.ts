import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/firebaseAuth';

export const createOnboardingFolder = async (req: AuthRequest, res: Response) : Promise<void>=> {
  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return
  } 

  try {
    const user = await prisma.user.findUnique({
      where: { firebaseUid: req.uid }
    });
    if (!user)  {
       res.status(404).json({ error: 'User not found' });
       return;
    }
     
    

    // 이미 생성 여부 확인
    const existing = await prisma.folder.findFirst({
      where: {
        ownerId: user.id,
        name: '나의 첫 클리핑 폴더'
      }
    });

    if (existing) {
      res.status(400).json({ error: 'Onboarding folder already exists' });
      return;
    }

    // 폴더 생성
    const folder = await prisma.folder.create({
      data: {
        name: '나의 첫 클리핑 폴더',
        ownerId: user.id
      }
    });

    // 기본 링크 생성
    await prisma.link.createMany({
      data: [
        {
          title: 'Clippy 소개',
          url: 'https://example.com/intro',
          folderId: folder.id
        },
        {
          title: '링크 저장하는 법',
          url: 'https://example.com/guide',
          folderId: folder.id
        }
      ]
    });

    res.status(201).json({ message: 'Onboarding folder created', folderId: folder.id });
    return;

  } catch (err) {
    console.error('❌ 온보딩 폴더 생성 에러:', err);
    res.status(500).json({ error: 'Server error' });
    return;
  }
};
