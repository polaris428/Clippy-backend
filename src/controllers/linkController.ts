import { Request, Response } from 'express';
import { prisma } from '../prisma/client';
import { AuthRequest } from '../middlewares/firebaseAuth';

export const createLink = async (req: AuthRequest, res: Response): Promise<void> => {
  const { title, url, folderId, tags } = req.body;

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

    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        OR: [
          { ownerId: user.id },
          { shares: { some: { userId: user.id } } }
        ]
      }
    });

    if (!folder) {
      res.status(403).json({ error: 'You do not have access to this folder' });
      return;
    }

    const tagRecords = await Promise.all(
      (tags || []).map((tag: string) =>
        prisma.tag.upsert({
          where: { name: tag },
          update: {},
          create: { name: tag },
        })
      )
    );

    const newLink = await prisma.link.create({
      data: {
        title,
        url,
        folderId: folder.id,
        linkTags: {
          create: tagRecords.map((tag) => ({ tagId: tag.id }))
        }
      },
      include: {
        linkTags: { include: { tag: true } }
      }
    });

    res.status(201).json({
      id: newLink.id,
      title: newLink.title,
      url: newLink.url,
      tags: newLink.linkTags.map((lt) => lt.tag.name),
      folderId: newLink.folderId,
      createdAt: newLink.createdAt
    });

  } catch (err) {
    console.error('❌ 링크 저장 에러:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

export const getLinks = async (req: AuthRequest, res: Response) => {
  const folderId = req.query.folderId as string;

  if (!req.uid) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  if (!folderId) {
    res.status(400).json({ error: 'folderId query parameter is required' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { firebaseUid: req.uid } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // 접근 권한 확인 (소유자 or 공유받은 사용자)
    const folder = await prisma.folder.findFirst({
      where: {
        id: folderId,
        OR: [
          { ownerId: user.id },
          { shares: { some: { userId: user.id } } }
        ]
      }
    });

    if (!folder) {
      res.status(403).json({ error: 'You do not have access to this folder' });
      return;
    }

    const links = await prisma.link.findMany({
      where: { folderId },
      include: {
        linkTags: {
          include: {
            tag: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const result = links.map(link => ({
      id: link.id,
      title: link.title,
      url: link.url,
      createdAt: link.createdAt,
      tags: link.linkTags.map(lt => lt.tag.name)
    }));

    res.json(result);

  } catch (err) {
    console.error('❌ 링크 조회 에러:', err);
    res.status(500).json({ error: 'Server error' });
  }
};