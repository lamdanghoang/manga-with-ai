import { Router } from "express";
import { prisma } from "../lib/prisma";

const router = Router();

/**
 * GET /v1/leaderboard/creators
 * Top creators ranked by total likes, views, stories published.
 * Score = likes*3 + views + shares*2
 * Query params: ?period=week|month|all&limit=20
 */
router.get("/leaderboard/creators", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const period = (req.query.period as string) || "all";

  let dateFilter: Date | null = null;
  if (period === "week") {
    dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === "month") {
    dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  }

  type CreatorRow = {
    user_id: string;
    wallet_address: string;
    display_name: string | null;
    avatar_url: string | null;
    total_stories: bigint;
    total_likes: bigint;
    total_views: bigint;
    total_shares: bigint;
    score: bigint;
  };

  const creators = await prisma.$queryRaw<CreatorRow[]>`
    SELECT 
      u.id as user_id,
      u.wallet_address,
      u.display_name,
      u.avatar_url,
      COUNT(DISTINCT s.id) as total_stories,
      COALESCE(SUM(m.like_count), 0) as total_likes,
      COALESCE(SUM(m.view_count), 0) as total_views,
      COALESCE(SUM(m.share_count), 0) as total_shares,
      (COALESCE(SUM(m.like_count), 0) * 3 + COALESCE(SUM(m.view_count), 0) + COALESCE(SUM(m.share_count), 0) * 2) as score
    FROM users u
    INNER JOIN stories s ON s.owner_user_id = u.id AND s.visibility = 'public'
    LEFT JOIN public_story_metrics m ON m.story_id = s.id
    WHERE (${dateFilter}::timestamp IS NULL OR s.created_at >= ${dateFilter}::timestamp)
    GROUP BY u.id, u.wallet_address, u.display_name, u.avatar_url
    HAVING COUNT(DISTINCT s.id) > 0
    ORDER BY score DESC
    LIMIT ${limit}
  `;

  res.json({
    period,
    items: creators.map((c, idx) => ({
      rank: idx + 1,
      userId: c.user_id,
      walletAddress: c.wallet_address,
      displayName: c.display_name,
      avatarUrl: c.avatar_url,
      totalStories: Number(c.total_stories),
      totalLikes: Number(c.total_likes),
      totalViews: Number(c.total_views),
      totalShares: Number(c.total_shares),
      score: Number(c.score),
    })),
  });
});

/**
 * GET /v1/leaderboard/stories
 * Top stories by likes/views/score
 * Query params: ?period=week|month|all&limit=20&sort=likes|views|score
 */
router.get("/leaderboard/stories", async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  const period = (req.query.period as string) || "all";
  const sort = (req.query.sort as string) || "score";

  let dateFilter: any = {};
  if (period === "week") {
    dateFilter = {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    };
  } else if (period === "month") {
    dateFilter = {
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    };
  }

  const stories = await prisma.story.findMany({
    where: {
      visibility: "public",
      ...dateFilter,
    },
    include: {
      metrics: true,
      owner: {
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          avatarUrl: true,
        },
      },
    },
    take: limit,
  });

  // Calculate score and sort
  const scored = stories.map((s) => {
    const likes = Number(s.metrics?.likeCount || 0);
    const views = Number(s.metrics?.viewCount || 0);
    const shares = Number(s.metrics?.shareCount || 0);
    const score = likes * 3 + views + shares * 2;
    return {
      storyId: s.id,
      title: s.title,
      slug: s.publicSlug,
      coverImageUrl: s.coverImageUrl,
      totalChapters: s.totalChapters,
      creator: {
        userId: s.owner.id,
        walletAddress: s.owner.walletAddress,
        displayName: s.owner.displayName,
        avatarUrl: s.owner.avatarUrl,
      },
      likes,
      views,
      shares,
      score,
    };
  });

  if (sort === "likes") scored.sort((a, b) => b.likes - a.likes);
  else if (sort === "views") scored.sort((a, b) => b.views - a.views);
  else scored.sort((a, b) => b.score - a.score);

  res.json({
    period,
    items: scored.map((s, idx) => ({ rank: idx + 1, ...s })),
  });
});

export default router;
