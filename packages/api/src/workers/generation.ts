import { prisma } from '../lib/prisma';
import { generateStructuredJSON, generateText } from '../lib/gemini';
import { generateImage } from '../lib/gemini';
import { uploadImage, uploadImageSync } from '../lib/storage';

// Remove null bytes and invalid UTF-8 from strings before DB insert
function sanitize(str: string): string {
  return str.replace(/\x00/g, '').replace(/[\uFFFD]/g, '');
}

const STORY_BIBLE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    title: { type: 'STRING' },
    synopsis: { type: 'STRING' },
    logline: { type: 'STRING' },
    genre: { type: 'STRING' },
    characters: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING' },
          role: { type: 'STRING' },
          description: { type: 'STRING' },
          appearance: { type: 'STRING' },
          personality: { type: 'STRING' },
          outfit: { type: 'STRING' },
        },
        required: ['name', 'role', 'appearance'],
      },
    },
    locations: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: { name: { type: 'STRING' }, description: { type: 'STRING' }, visualDescription: { type: 'STRING' } },
        required: ['name', 'visualDescription'],
      },
    },
    worldRules: { type: 'ARRAY', items: { type: 'STRING' } },
    artDirection: { type: 'STRING' },
  },
  required: ['title', 'synopsis', 'characters', 'locations'],
};

const SCENE_PLAN_SCHEMA = {
  type: 'OBJECT',
  properties: {
    chapterTitle: { type: 'STRING' },
    canonicalSummary: { type: 'STRING' },
    panels: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          panelNumber: { type: 'INTEGER' },
          narration: { type: 'STRING' },
          dialogue: { type: 'ARRAY', items: { type: 'STRING' } },
          visualPrompt: { type: 'STRING' },
          characters: { type: 'ARRAY', items: { type: 'STRING' } },
          location: { type: 'STRING' },
        },
        required: ['panelNumber', 'visualPrompt'],
      },
    },
  },
  required: ['chapterTitle', 'canonicalSummary', 'panels'],
};

interface StoryBibleResult {
  title: string; synopsis: string; logline: string; genre: string;
  characters: { name: string; role: string; description: string; appearance: string; personality: string; outfit: string }[];
  locations: { name: string; description: string; visualDescription: string }[];
  worldRules: string[]; artDirection: string;
}

interface ScenePlanResult {
  chapterTitle: string; canonicalSummary: string;
  panels: { panelNumber: number; narration: string; dialogue: string[]; visualPrompt: string; characters: string[]; location: string }[];
}

export async function processCreateStory(jobId: string) {
  const job = await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'running', startedAt: new Date() } });
  const { prompt, stylePreset, panelCount } = job.inputPayload as any;

  try {
    // Step 1: Extract Story Bible
    const bible = await generateStructuredJSON<StoryBibleResult>({
      prompt: `Create a manga story bible from this prompt: "${prompt}". Generate ${panelCount} panels for chapter 1. Style: ${stylePreset}.`,
      systemInstruction: 'You are a manga story architect. Create detailed story bibles with consistent characters and locations. Output JSON only.',
      schema: STORY_BIBLE_SCHEMA,
    });

    // Update story
    await prisma.story.update({ where: { id: job.storyId! }, data: { title: bible.title, synopsis: bible.synopsis, status: 'ongoing' } });

    // Save story bible
    await prisma.storyBible.create({
      data: {
        storyId: job.storyId!, version: 1, logline: bible.logline, genre: bible.genre,
        artDirection: { style: bible.artDirection || stylePreset },
        worldRules: { rules: bible.worldRules || [] },
        canonFacts: [], openThreads: [], timelineSummary: [],
        rawBible: bible as any,
      },
    });

    // Save characters
    for (const char of bible.characters) {
      await prisma.character.create({
        data: {
          storyId: job.storyId!, name: char.name, role: char.role, description: char.description,
          appearanceTraits: { appearance: char.appearance },
          personalityTraits: { personality: char.personality || '' },
          canonicalOutfit: { outfit: char.outfit || '' },
          referencePrompt: char.appearance,
        },
      });
    }

    // Save locations
    for (const loc of bible.locations) {
      await prisma.location.create({
        data: { storyId: job.storyId!, name: loc.name, description: loc.description, visualTraits: { visual: loc.visualDescription } },
      });
    }

    // Step 2: Scene plan for chapter 1
    const scenePlan = await generateStructuredJSON<ScenePlanResult>({
      prompt: `Based on this story bible, create a scene plan for chapter 1 with exactly ${panelCount} panels.\n\nStory: ${bible.title}\nSynopsis: ${bible.synopsis}\nCharacters: ${bible.characters.map(c => `${c.name} - ${c.appearance}`).join('; ')}\nLocations: ${bible.locations.map(l => `${l.name} - ${l.visualDescription}`).join('; ')}\nStyle: ${stylePreset === 'manga-bw' ? 'black and white manga with screentone shading' : 'soft color manga illustration'}`,
      systemInstruction: 'You are a manga panel director. Create detailed visual prompts for each panel that maintain character consistency. Each visualPrompt should describe the exact scene for image generation.',
      schema: SCENE_PLAN_SCHEMA,
    });

    // Create chapter
    const chapter = await prisma.chapter.create({
      data: {
        storyId: job.storyId!, chapterNumber: 1, title: scenePlan.chapterTitle,
        userPrompt: prompt, canonicalSummary: scenePlan.canonicalSummary,
        panelCount: scenePlan.panels.length,
      },
    });

    // Step 3: Generate full manga page with all panels in one image
    const stylePrefix = stylePreset === 'manga-bw'
      ? 'Black and white manga page with screentone shading, dramatic inking, professional manga layout.'
      : 'Soft color manga page illustration style, pastel tones, professional manga layout.';

    const panelDescriptions = scenePlan.panels.map((p, i) =>
      `Panel ${i + 1}: ${p.visualPrompt}${p.characters?.length ? ` (Characters: ${p.characters.join(', ')})` : ''}${p.location ? ` (Location: ${p.location})` : ''}`
    ).join('\n');

    const fullPagePrompt = `${stylePrefix} Create a single manga page with ${scenePlan.panels.length} panels arranged in a dynamic manga layout with panel borders, speech bubbles, and varied panel sizes. The page should look like a professional manga page from a published manga.\n\n${panelDescriptions}`;

    // Save panel metadata
    for (const panel of scenePlan.panels) {
      await prisma.chapterPanel.create({
        data: {
          chapterId: chapter.id, panelNumber: panel.panelNumber,
          narrationText: panel.narration || null,
          dialogueText: panel.dialogue || [],
          visualPrompt: sanitize(panel.visualPrompt),
        },
      });
    }

    // Generate one full page image with character references
    const charRefs = await prisma.character.findMany({ where: { storyId: job.storyId!, referenceImageUrl: { not: null } }, take: 5 });
    let chapterImageUrl: string | null = null;
    try {
      const refImages = charRefs.filter(c => c.referenceImageUrl && c.referenceImageUrl.startsWith('data:')).map(c => ({ data: c.referenceImageUrl!.replace(/^data:[^;]+;base64,/, ''), mimeType: 'image/png' }));
      const result = await generateImage({ prompt: fullPagePrompt, referenceImages: refImages.length ? refImages : undefined, aspectRatio: '2:3' });
      console.log('[IMAGE] Got image, size:', result.imageData.length, 'bytes');
      chapterImageUrl = uploadImageSync(result.imageData, result.mimeType);
      console.log('[IMAGE] Saved to:', chapterImageUrl);
    } catch (imgErr: any) {
      if (!imgErr.message?.includes('EPROTO')) {
        console.error("Image generation failed:", imgErr.message);
      } else {
        console.warn('[IMAGE] SSL background error (ignored)');
      }
    }
    // Save asset to DB (outside try-catch to avoid SSL interference)
    if (chapterImageUrl) {
      await prisma.asset.create({
        data: {
          ownerUserId: job.userId, storyId: job.storyId!, chapterId: chapter.id,
          assetType: 'chapter_page', fileUrl: chapterImageUrl, mimeType: 'image/png',
          generationModel: 'gemini-2.5-flash-image', generationParams: { prompt: sanitize(fullPagePrompt).slice(0, 500) },
        },
      });
      console.log('[IMAGE] Asset saved to DB');
    }

    // Update story counts + set cover from first chapter image
    const coverAsset = await prisma.asset.findFirst({ where: { storyId: job.storyId!, assetType: 'chapter_page' } });
    await prisma.story.update({ where: { id: job.storyId! }, data: { totalChapters: 1, totalPanels: scenePlan.panels.length, coverImageUrl: coverAsset?.fileUrl || null } });
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'completed', chapterId: chapter.id, finishedAt: new Date() } });
  } catch (err: any) {
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: sanitize(err.message || "Unknown error"), finishedAt: new Date() } });
  }
}

export async function processContinueStory(jobId: string) {
  const job = await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'running', startedAt: new Date() } });
  const { prompt, branchMode } = job.inputPayload as any;

  try {
    const story = await prisma.story.findUnique({ where: { id: job.storyId! } });
    const bible = await prisma.storyBible.findFirst({ where: { storyId: job.storyId! }, orderBy: { version: 'desc' } });
    const characters = await prisma.character.findMany({ where: { storyId: job.storyId!, status: 'active' } });
    const prevChapters = await prisma.chapter.findMany({ where: { storyId: job.storyId! }, orderBy: { chapterNumber: 'desc' }, take: 3 });

    const chapterNumber = (prevChapters[0]?.chapterNumber || 0) + 1;
    const recap = prevChapters.map(c => c.canonicalSummary).filter(Boolean).join('\n');

    // Canon validation + scene plan in one call
    const scenePlan = await generateStructuredJSON<ScenePlanResult>({
      prompt: `Continue this manga story.\n\nTitle: ${story!.title}\nRecap: ${recap}\nCharacters: ${characters.map(c => `${c.name} - ${JSON.stringify(c.appearanceTraits)}`).join('; ')}\nWorld rules: ${JSON.stringify(bible?.worldRules)}\n\nUser wants: "${prompt}"\nBranch mode: ${branchMode}\n\nCreate a scene plan for chapter ${chapterNumber} with 4-6 panels.`,
      systemInstruction: 'You are a manga continuation director. Maintain character consistency and story canon. Create panel-by-panel visual prompts.',
      schema: SCENE_PLAN_SCHEMA,
    });

    const chapter = await prisma.chapter.create({
      data: {
        storyId: job.storyId!, chapterNumber, title: scenePlan.chapterTitle,
        userPrompt: prompt, continuationMode: branchMode,
        canonicalSummary: scenePlan.canonicalSummary, panelCount: scenePlan.panels.length,
      },
    });

    const stylePrefix = story!.stylePreset === 'manga-bw'
      ? 'Black and white manga page with screentone shading, professional manga layout.'
      : 'Soft color manga page illustration style, professional manga layout.';

    const panelDescriptions = scenePlan.panels.map((p, i) =>
      `Panel ${i + 1}: ${p.visualPrompt}${p.characters?.length ? ` (Characters: ${p.characters.join(', ')})` : ''}`
    ).join('\n');

    const fullPagePrompt = `${stylePrefix} Create a single manga page with ${scenePlan.panels.length} panels arranged in a dynamic manga layout with panel borders, speech bubbles, and varied panel sizes.\n\n${panelDescriptions}`;

    for (const panel of scenePlan.panels) {
      await prisma.chapterPanel.create({
        data: { chapterId: chapter.id, panelNumber: panel.panelNumber, narrationText: panel.narration || null, dialogueText: panel.dialogue || [], visualPrompt: sanitize(panel.visualPrompt) },
      });
    }

    // Generate one full page image with character references
    const charRefs = characters.filter(c => c.referenceImageUrl).slice(0, 5);
    let continueImageUrl: string | null = null;
    try {
      const refImages = charRefs.map(c => ({ data: c.referenceImageUrl!.replace(/^data:[^;]+;base64,/, ''), mimeType: 'image/png' }));
      const result = await generateImage({ prompt: fullPagePrompt, referenceImages: refImages.length ? refImages : undefined, aspectRatio: '2:3' });
      continueImageUrl = uploadImageSync(result.imageData, result.mimeType);
      console.log('[IMAGE] Continue saved to:', continueImageUrl);
    } catch (imgErr: any) {
      if (!imgErr.message?.includes('EPROTO')) {
        console.error("Continue image failed:", imgErr.message);
      } else {
        console.warn('[IMAGE] SSL error (ignored)');
      }
    }
    if (continueImageUrl) {
      await prisma.asset.create({
        data: { ownerUserId: job.userId, storyId: job.storyId!, chapterId: chapter.id, assetType: 'chapter_page', fileUrl: continueImageUrl, mimeType: 'image/png', generationModel: 'gemini-2.5-flash-image', generationParams: { prompt: sanitize(fullPagePrompt).slice(0, 500) } },
      });
    }

    // Update bible version
    const newVersion = (bible?.version || 0) + 1;
    await prisma.storyBible.create({
      data: {
        storyId: job.storyId!, version: newVersion,
        logline: bible?.logline, genre: bible?.genre,
        artDirection: bible?.artDirection || {}, worldRules: bible?.worldRules || {},
        canonFacts: [...(bible?.canonFacts as any[] || []), scenePlan.canonicalSummary],
        openThreads: bible?.openThreads || [], timelineSummary: [...(bible?.timelineSummary as any[] || []), { chapter: chapterNumber, summary: scenePlan.canonicalSummary }],
        rawBible: bible?.rawBible || {},
      },
    });

    await prisma.story.update({ where: { id: job.storyId! }, data: { totalChapters: chapterNumber, latestStoryBibleVersion: newVersion } });
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'completed', chapterId: chapter.id, finishedAt: new Date() } });
  } catch (err: any) {
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: sanitize(err.message || "Unknown error"), finishedAt: new Date() } });
  }
}

export async function processRegeneratePanel(jobId: string) {
  const job = await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'running', startedAt: new Date() } });
  const { panelId } = job.inputPayload as any;

  try {
    const panel = await prisma.chapterPanel.findUnique({ where: { id: panelId }, include: { chapter: { include: { story: true } } } });
    if (!panel) throw new Error('Panel not found');

    // Deactivate old assets
    await prisma.asset.updateMany({ where: { panelId, isActive: true }, data: { isActive: false } });

    const result = await generateImage({ prompt: panel.visualPrompt, aspectRatio: panel.chapter.story.aspectRatio || '3:4' });
    const fileUrl = uploadImageSync(result.imageData, result.mimeType);

    await prisma.asset.create({
      data: { ownerUserId: job.userId, storyId: panel.chapter.storyId, chapterId: panel.chapterId, panelId, assetType: 'panel_image', fileUrl, mimeType: result.mimeType, generationModel: 'gemini-3-pro-image-preview', generationParams: { prompt: sanitize(panel.visualPrompt) }, version: 2 },
    });

    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'completed', finishedAt: new Date() } });
  } catch (err: any) {
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: sanitize(err.message || "Unknown error"), finishedAt: new Date() } });
  }
}

export async function processRegenerateChapter(jobId: string) {
  const job = await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'running', startedAt: new Date() } });

  try {
    const chapter = await prisma.chapter.findUnique({ where: { id: job.chapterId! }, include: { panels: true, story: true } });
    if (!chapter) throw new Error('Chapter not found');

    for (const panel of chapter.panels) {
      await prisma.asset.updateMany({ where: { panelId: panel.id, isActive: true }, data: { isActive: false } });

      try {
        const result = await generateImage({ prompt: panel.visualPrompt, aspectRatio: chapter.story.aspectRatio || '3:4' });
        const fileUrl = uploadImageSync(result.imageData, result.mimeType);
        await prisma.asset.create({
          data: { ownerUserId: job.userId, storyId: chapter.storyId, chapterId: chapter.id, panelId: panel.id, assetType: 'panel_image', fileUrl, mimeType: result.mimeType, generationModel: 'gemini-3-pro-image-preview', generationParams: { prompt: sanitize(panel.visualPrompt) }, version: 2 },
        });
      } catch (imgErr: any) {
        console.error(`Regen panel ${panel.panelNumber} failed:`, imgErr.message);
      }
    }

    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'completed', finishedAt: new Date() } });
  } catch (err: any) {
    await prisma.generationJob.update({ where: { id: jobId }, data: { status: 'failed', errorMessage: sanitize(err.message || "Unknown error"), finishedAt: new Date() } });
  }
}
