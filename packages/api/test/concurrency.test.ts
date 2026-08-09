import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import test from "node:test";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.TEST_DATABASE_URL;
const prisma = databaseUrl ? new PrismaClient({ datasources: { db: { url: databaseUrl } } }) : null;
const integration = databaseUrl ? test : test.skip;

integration("one credit cannot be claimed by concurrent requests", async () => {
  const user = await prisma!.user.create({ data: { walletAddress: `0x${randomBytes(20).toString("hex")}`, credits: 1 } });
  try {
    const claims = await Promise.all(Array.from({ length: 8 }, () => prisma!.user.updateMany({
      where: { id: user.id, credits: { gt: 0 } }, data: { credits: { decrement: 1 } },
    })));
    assert.equal(claims.reduce((sum, claim) => sum + claim.count, 0), 1);
    assert.equal((await prisma!.user.findUniqueOrThrow({ where: { id: user.id } })).credits, 0);
  } finally { await prisma!.user.delete({ where: { id: user.id } }); }
});

integration("a payment transaction can be attached to only one generation job", async () => {
  const user = await prisma!.user.create({ data: { walletAddress: `0x${randomBytes(20).toString("hex")}` } });
  const story = await prisma!.story.create({ data: { ownerUserId: user.id, title: "Concurrency test" } });
  const jobs = await Promise.all([1, 2].map(() => prisma!.generationJob.create({ data: {
    userId: user.id, storyId: story.id, jobType: "create_story", inputPayload: {},
  }})));
  try {
    const txHash = `0x${randomBytes(32).toString("hex")}`;
    const results = await Promise.allSettled(jobs.map((job) => prisma!.generationPayment.create({ data: {
      txHash, userId: user.id, generationJobId: job.id, token: "USDC", chainId: 11142220,
    }})));
    assert.equal(results.filter((result) => result.status === "fulfilled").length, 1);
    assert.equal(results.filter((result) => result.status === "rejected").length, 1);
  } finally { await prisma!.user.delete({ where: { id: user.id } }); }
});

test.after(async () => { await prisma?.$disconnect(); });
