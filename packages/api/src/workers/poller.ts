import { prisma } from '../lib/prisma';
import { processCreateStory, processContinueStory, processRegeneratePanel, processRegenerateChapter } from './generation';

let running = false;

export async function pollJobs() {
  if (running) return;
  running = true;

  try {
    // Finalize jobs abandoned by a crashed worker. Re-running generation is not
    // safe until every generation step is idempotent, so fail and refund instead.
    const staleJobs = await prisma.generationJob.findMany({
      where: { status: 'running', startedAt: { lt: new Date(Date.now() - 10 * 60_000) } },
      select: { id: true, userId: true },
    });
    for (const stale of staleJobs) {
      await prisma.$transaction(async (tx) => {
        const job = await tx.generationJob.findUnique({ where: { id: stale.id } });
        if (!job || job.status !== 'running') return;
        await tx.generationJob.update({ where: { id: job.id }, data: {
          status: 'failed', errorMessage: 'Generation worker timed out', finishedAt: new Date(),
          creditRefunded: job.creditCharged || job.creditRefunded,
        } });
        if (job.creditCharged && !job.creditRefunded) {
          await tx.user.update({ where: { id: job.userId }, data: { credits: { increment: 1 } } });
        }
      });
    }
    const job = await prisma.generationJob.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
    if (!job) { running = false; return; }

    // Claim through a conditional write. Only one API replica may process this job.
    const claimed = await prisma.generationJob.updateMany({
      where: { id: job.id, status: 'queued' },
      data: { status: 'running', startedAt: new Date() },
    });
    if (claimed.count !== 1) { running = false; return; }

    if (job.jobType === 'create_story') await processCreateStory(job.id);
    else if (job.jobType === 'continue_story') await processContinueStory(job.id);
    else if (job.jobType === 'regenerate_panel') await processRegeneratePanel(job.id);
    else if (job.jobType === 'regenerate_chapter') await processRegenerateChapter(job.id);
    else await prisma.generationJob.update({
      where: { id: job.id },
      data: { status: 'failed', errorMessage: `Unsupported job type: ${job.jobType}`, finishedAt: new Date() },
    });
  } catch (err) {
    console.error('Job poll error:', err);
  }

  running = false;
}

export function startJobPoller(intervalMs = 3000) {
  setInterval(pollJobs, intervalMs);
  console.log(`Job poller started (interval: ${intervalMs}ms)`);
}
