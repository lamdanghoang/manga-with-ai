import { prisma } from './prisma';

export function findOwnedStory(userId: string, storyId: string) {
  return prisma.story.findFirst({ where: { id: storyId, ownerUserId: userId } });
}

export function findOwnedChapter(userId: string, chapterId: string) {
  return prisma.chapter.findFirst({
    where: { id: chapterId, story: { ownerUserId: userId } },
    include: { story: true },
  });
}

export function findOwnedPanel(userId: string, panelId: string) {
  return prisma.chapterPanel.findFirst({
    where: { id: panelId, chapter: { story: { ownerUserId: userId } } },
    include: { chapter: { include: { story: true } } },
  });
}
