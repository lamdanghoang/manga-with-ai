import { Router, Response } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware, AuthRequest } from "./auth";

const router = Router();

router.post(
  "/stories",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { prompt, stylePreset, panelCount, title, characterRefs } = req.body;
    if (!prompt || !stylePreset || !panelCount) {
      res
        .status(400)
        .json({ error: "Missing prompt, stylePreset, or panelCount" });
      return;
    }

    const story = await prisma.story.create({
      data: {
        ownerUserId: req.userId!,
        title: title || "Untitled Story",
        status: "draft",
        stylePreset,
        aspectRatio: "3:4",
      },
    });

    // Save character reference images if provided
    if (characterRefs?.length) {
      for (const ref of characterRefs) {
        await prisma.character.create({
          data: {
            storyId: story.id,
            name: ref.name || "Character",
            role: ref.role || "main",
            referenceImageUrl: ref.imageData, // base64 data URL
            appearanceTraits: {},
            personalityTraits: {},
            canonicalOutfit: {},
          },
        });
      }
    }

    const job = await prisma.generationJob.create({
      data: {
        userId: req.userId!,
        storyId: story.id,
        jobType: "create_story",
        status: "queued",
        inputPayload: {
          prompt,
          stylePreset,
          panelCount,
          paymentTx: (req as any).paymentTx || null,
        },
      },
    });


    res
      .status(202)
      .json({
        jobId: job.id,
        status: "queued",
        storyId: story.id,
        chapterId: null,
      });
  },
);

router.get(
  "/stories",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const where: any = { ownerUserId: req.userId! };
    if (req.query.visibility && req.query.visibility !== "all")
      where.visibility = req.query.visibility as string;
    if (req.query.status && req.query.status !== "all")
      where.status = req.query.status as string;

    const stories = await prisma.story.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        synopsis: true,
        coverImageUrl: true,
        visibility: true,
        status: true,
        totalChapters: true,
        updatedAt: true,
      },
    });
    res.json({ items: stories });
  },
);

router.get(
  "/stories/:storyId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const storyId = req.params.storyId as string;
    const story = await prisma.story.findFirst({
      where: { id: storyId, ownerUserId: req.userId! },
    });
    if (!story) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const chapters = await prisma.chapter.findMany({
      where: { storyId },
      orderBy: { chapterNumber: "asc" },
      select: {
        id: true,
        chapterNumber: true,
        title: true,
        panelCount: true,
        createdAt: true,
      },
    });
    const characters = await prisma.character.findMany({
      where: { storyId },
      select: {
        id: true,
        name: true,
        role: true,
        description: true,
        referenceImageUrl: true,
      },
    });
    const locations = await prisma.location.findMany({
      where: { storyId },
      select: {
        id: true,
        name: true,
        description: true,
        referenceImageUrl: true,
      },
    });

    res.json({ story, chapters, characters, locations });
  },
);

router.patch(
  "/stories/:storyId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { title, synopsis, visibility, status } = req.body;
    const result = await prisma.story.updateMany({
      where: { id: req.params.storyId as string, ownerUserId: req.userId! },
      data: {
        ...(title && { title }),
        ...(synopsis && { synopsis }),
        ...(visibility && { visibility }),
        ...(status && { status }),
      },
    });
    if (!result.count) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({ success: true });
  },
);

router.get(
  "/jobs/:jobId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const job = await prisma.generationJob.findFirst({
      where: { id: req.params.jobId as string, userId: req.userId! },
    });
    if (!job) {
      res.status(404).json({ error: "Not found" });
      return;
    }
    res.json({
      id: job.id,
      status: job.status,
      jobType: job.jobType,
      storyId: job.storyId,
      chapterId: job.chapterId,
      errorMessage: job.errorMessage,
    });
  },
);

router.post(
  "/stories/:storyId/chapters",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { prompt, branchMode } = req.body;
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { id: req.params.storyId as string, ownerUserId: req.userId! },
    });
    if (!story) {
      res.status(404).json({ error: "Story not found" });
      return;
    }

    const job = await prisma.generationJob.create({
      data: {
        userId: req.userId!,
        storyId: story.id,
        jobType: "continue_story",
        status: "queued",
        inputPayload: {
          prompt,
          branchMode: branchMode || "canon",
          paymentTx: (req as any).paymentTx || null,
        },
      },
    });


    res
      .status(202)
      .json({
        jobId: job.id,
        status: "queued",
        storyId: story.id,
        chapterId: null,
      });
  },
);

router.get(
  "/stories/:storyId/chapters/:chapterId",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const chapter = await prisma.chapter.findFirst({
      where: {
        id: req.params.chapterId as string,
        storyId: req.params.storyId as string,
      },
      include: { panels: { orderBy: { panelNumber: "asc" } } },
    });
    if (!chapter) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    // Get full page image (chapter_page asset)
    const pageAsset = await prisma.asset.findFirst({
      where: {
        chapterId: chapter.id,
        assetType: "chapter_page",
        isActive: true,
      },
    });

    res.json({
      id: chapter.id,
      storyId: chapter.storyId,
      chapterNumber: chapter.chapterNumber,
      title: chapter.title,
      canonicalSummary: chapter.canonicalSummary,
      pageImageUrl: pageAsset?.fileUrl || null,
      mintTxHash: (chapter as any).mintTxHash || null,
      panels: chapter.panels.map((p: any) => ({
        id: p.id,
        panelNumber: p.panelNumber,
        narrationText: p.narrationText,
        dialogueText: p.dialogueText,
      })),
    });
  },
);

// Publish story
router.post(
  "/stories/:storyId/publish",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const story = await prisma.story.findFirst({
      where: { id: req.params.storyId as string, ownerUserId: req.userId! },
    });
    if (!story) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const slug =
      story.publicSlug ||
      `${story.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 60)}-${story.id.slice(0, 8)}`;
    await prisma.story.update({
      where: { id: story.id },
      data: { visibility: "public", publicSlug: slug },
    });
    await prisma.publicStoryMetrics.upsert({
      where: { storyId: story.id },
      update: {},
      create: { storyId: story.id },
    });

    res.json({ storyId: story.id, visibility: "public", publicSlug: slug });
  },
);

// Public endpoints (no auth)
router.get("/public/stories/:slug", async (req, res) => {
  const story = await prisma.story.findFirst({
    where: { publicSlug: req.params.slug as string, visibility: "public" },
  });
  if (!story) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const chapters = await prisma.chapter.findMany({
    where: { storyId: story.id },
    orderBy: { chapterNumber: "asc" },
    select: {
      id: true,
      chapterNumber: true,
      title: true,
      panelCount: true,
      createdAt: true,
    },
  });

  // Increment view count
  await prisma.publicStoryMetrics.upsert({
    where: { storyId: story.id },
    update: { viewCount: { increment: 1 } },
    create: { storyId: story.id, viewCount: 1 },
  });

  res.json({
    title: story.title,
    synopsis: story.synopsis,
    coverImageUrl: story.coverImageUrl,
    chapters,
  });
});

router.get("/public/stories/:slug/chapters/:chapterId", async (req, res) => {
  const story = await prisma.story.findFirst({
    where: { publicSlug: req.params.slug as string, visibility: "public" },
  });
  if (!story) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.chapterId as string, storyId: story.id },
    include: { panels: { orderBy: { panelNumber: "asc" } } },
  });
  if (!chapter) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const pageAsset = await prisma.asset.findFirst({
    where: { chapterId: chapter.id, assetType: "chapter_page", isActive: true },
  });

  res.json({
    id: chapter.id,
    storyId: chapter.storyId,
    chapterNumber: chapter.chapterNumber,
    title: chapter.title,
    canonicalSummary: chapter.canonicalSummary,
    pageImageUrl: pageAsset?.fileUrl || null,
      mintTxHash: (chapter as any).mintTxHash || null,
    panels: chapter.panels.map((p: any) => ({
      id: p.id,
      panelNumber: p.panelNumber,
      narrationText: p.narrationText,
      dialogueText: p.dialogueText,
    })),
  });
});

// Regenerate endpoints
router.post(
  "/chapters/:chapterId/regenerate",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const chapter = await prisma.chapter.findFirst({
      where: { id: req.params.chapterId as string },
      include: { story: true },
    });
    if (!chapter || chapter.story.ownerUserId !== req.userId!) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const job = await prisma.generationJob.create({
      data: {
        userId: req.userId!,
        storyId: chapter.storyId,
        chapterId: chapter.id,
        jobType: "regenerate_chapter",
        status: "queued",
        inputPayload: {},
      },
    });
    res
      .status(202)
      .json({
        jobId: job.id,
        status: "queued",
        storyId: chapter.storyId,
        chapterId: chapter.id,
      });
  },
);

router.post(
  "/panels/:panelId/regenerate",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const panel = await prisma.chapterPanel.findFirst({
      where: { id: req.params.panelId as string },
      include: { chapter: { include: { story: true } } },
    });
    if (!panel || panel.chapter.story.ownerUserId !== req.userId!) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const job = await prisma.generationJob.create({
      data: {
        userId: req.userId!,
        storyId: panel.chapter.storyId,
        chapterId: panel.chapterId,
        jobType: "regenerate_panel",
        status: "queued",
        inputPayload: { panelId: panel.id },
      },
    });
    res
      .status(202)
      .json({
        jobId: job.id,
        status: "queued",
        storyId: panel.chapter.storyId,
        chapterId: panel.chapterId,
      });
  },
);

// Like a public story
router.post("/public/stories/:slug/like", async (req, res) => {
  const story = await prisma.story.findFirst({
    where: { publicSlug: req.params.slug as string, visibility: "public" },
  });
  if (!story) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.publicStoryMetrics.upsert({
    where: { storyId: story.id },
    update: { likeCount: { increment: 1 } },
    create: { storyId: story.id, likeCount: 1 },
  });
  const metrics = await prisma.publicStoryMetrics.findUnique({
    where: { storyId: story.id },
  });
  res.json({ likes: Number(metrics?.likeCount || 0) });
});

// Share count increment
router.post("/public/stories/:slug/share", async (req, res) => {
  const story = await prisma.story.findFirst({
    where: { publicSlug: req.params.slug as string, visibility: "public" },
  });
  if (!story) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  await prisma.publicStoryMetrics.upsert({
    where: { storyId: story.id },
    update: { shareCount: { increment: 1 } },
    create: { storyId: story.id, shareCount: 1 },
  });
  res.json({ success: true });
});

router.get("/public/feed", async (_req, res) => {
  const stories = await prisma.story.findMany({
    where: { visibility: "public" },
    orderBy: { updatedAt: "desc" },
    take: 20,
    select: {
      id: true,
      title: true,
      publicSlug: true,
      coverImageUrl: true,
      synopsis: true,
      totalChapters: true,
      updatedAt: true,
      metrics: {
        select: { viewCount: true, likeCount: true, shareCount: true },
      },
      _count: { select: { comments: true } },
    },
  });
  res.json({
    items: stories.map((s) => ({
      ...s,
      viewCount: Number(s.metrics?.viewCount || 0),
      likeCount: Number(s.metrics?.likeCount || 0),
      shareCount: Number(s.metrics?.shareCount || 0),
      commentCount: s._count?.comments || 0,
    })),
  });
});

// Comments
router.get("/public/stories/:slug/comments", async (req, res) => {
  const story = await prisma.story.findFirst({
    where: { publicSlug: req.params.slug as string, visibility: "public" },
  });
  if (!story) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const comments = await prisma.comment.findMany({
    where: { storyId: story.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      user: {
        select: { walletAddress: true, displayName: true, avatarUrl: true },
      },
    },
  });

  res.json({
    items: comments.map((c) => ({
      id: c.id,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
      user: {
        walletAddress: c.user.walletAddress,
        displayName: c.user.displayName,
        avatarUrl: c.user.avatarUrl,
      },
    })),
  });
});

router.post(
  "/public/stories/:slug/comments",
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    const { text } = req.body;
    if (!text || text.trim().length === 0 || text.length > 500) {
      res.status(400).json({ error: "Comment must be 1-500 characters" });
      return;
    }

    const story = await prisma.story.findFirst({
      where: { publicSlug: req.params.slug as string, visibility: "public" },
    });
    if (!story) {
      res.status(404).json({ error: "Not found" });
      return;
    }

    const comment = await prisma.comment.create({
      data: { storyId: story.id, userId: req.userId!, text: text.trim() },
      include: {
        user: {
          select: { walletAddress: true, displayName: true, avatarUrl: true },
        },
      },
    });

    res
      .status(201)
      .json({
        id: comment.id,
        text: comment.text,
        createdAt: comment.createdAt.toISOString(),
        user: {
          walletAddress: comment.user.walletAddress,
          displayName: comment.user.displayName,
          avatarUrl: comment.user.avatarUrl,
        },
      });
  },
);

// Generate NFT metadata JSON, upload to R2, return URL
router.post('/chapters/:chapterId/metadata', authMiddleware, async (req: AuthRequest, res: Response) => {
  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.chapterId as string },
    include: { story: true },
  });
  if (!chapter || chapter.story.ownerUserId !== req.userId!) { res.status(404).json({ error: 'Not found' }); return; }

  const asset = await prisma.asset.findFirst({ where: { chapterId: chapter.id, assetType: 'chapter_page', isActive: true } });
  if (!asset) { res.status(400).json({ error: 'No image for this chapter' }); return; }

  const metadata = {
    name: `${chapter.story.title} - Chapter ${chapter.chapterNumber}`,
    description: chapter.canonicalSummary || `Chapter ${chapter.chapterNumber} of ${chapter.story.title}. AI-generated manga by MangaWithAI.`,
    image: asset.fileUrl,
    attributes: [
      { trait_type: 'Story', value: chapter.story.title },
      { trait_type: 'Chapter', value: chapter.chapterNumber },
      { trait_type: 'Style', value: chapter.story.stylePreset },
      { trait_type: 'Generator', value: 'MangaWithAI' },
    ],
  };

  // Upload metadata JSON to R2
  const { uploadImage } = await import('../lib/storage');
  const metadataBuffer = Buffer.from(JSON.stringify(metadata, null, 2));
  const metadataUrl = await uploadImage(metadataBuffer, 'application/json');

  res.json({ metadataURI: metadataUrl, metadata });
});

// Mark chapter as minted
router.post('/chapters/:chapterId/minted', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { txHash } = req.body;
  if (!txHash) { res.status(400).json({ error: 'Missing txHash' }); return; }

  const chapter = await prisma.chapter.findFirst({
    where: { id: req.params.chapterId as string },
    include: { story: true },
  });
  if (!chapter || chapter.story.ownerUserId !== req.userId!) { res.status(404).json({ error: 'Not found' }); return; }

  await prisma.chapter.update({ where: { id: chapter.id }, data: { mintTxHash: txHash } as any });
  res.json({ success: true });
});

// Dynamic NFT metadata for story (used as tokenURI)
router.get('/nft/:storyId', async (req, res) => {
  const story = await prisma.story.findFirst({ where: { id: req.params.storyId as string } });
  if (!story) { res.status(404).json({ error: 'Not found' }); return; }

  const chapters = await prisma.chapter.findMany({ where: { storyId: story.id }, orderBy: { chapterNumber: 'asc' } });
  const assets = await prisma.asset.findMany({ where: { storyId: story.id, assetType: 'chapter_page', isActive: true }, orderBy: { createdAt: 'asc' } });

  res.json({
    name: story.title,
    description: story.synopsis || `AI-generated manga story by MangaWithAI.`,
    image: assets[0]?.fileUrl || '',
    attributes: [
      { trait_type: 'Chapters', value: chapters.length },
      { trait_type: 'Style', value: story.stylePreset },
      { trait_type: 'Generator', value: 'MangaWithAI' },
      { trait_type: 'Status', value: story.status },
    ],
    chapters: chapters.map((ch, i) => ({
      chapterNumber: ch.chapterNumber,
      title: ch.title,
      image: assets[i]?.fileUrl || null,
    })),
  });
});

// Mint story — return metadata URL
router.post('/stories/:storyId/mint-metadata', authMiddleware, async (req: AuthRequest, res: Response) => {
  const story = await prisma.story.findFirst({ where: { id: req.params.storyId as string, ownerUserId: req.userId! } });
  if (!story) { res.status(404).json({ error: 'Not found' }); return; }

  const metadataURI = `https://mangawithai.duckdns.org/v1/nft/${story.id}`;
  res.json({ metadataURI });
});

// Mark story as minted
router.post('/stories/:storyId/minted', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { txHash } = req.body;
  const story = await prisma.story.findFirst({ where: { id: req.params.storyId as string, ownerUserId: req.userId! } });
  if (!story) { res.status(404).json({ error: 'Not found' }); return; }

  await prisma.story.update({ where: { id: story.id }, data: { mintTxHash: txHash } as any });
  res.json({ success: true });
});

export default router;
