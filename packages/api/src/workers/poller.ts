import { prisma } from '../lib/prisma';
import { processCreateStory, processContinueStory, processRegeneratePanel, processRegenerateChapter } from './generation';

let running = false;

export async function pollJobs() {
  if (running) return;
  running = true;

  try {
    const job = await prisma.generationJob.findFirst({ where: { status: 'queued' }, orderBy: { createdAt: 'asc' } });
    if (!job) { running = false; return; }

    if (job.jobType === 'create_story') await processCreateStory(job.id);
    else if (job.jobType === 'continue_story') await processContinueStory(job.id);
    else if (job.jobType === 'regenerate_panel') await processRegeneratePanel(job.id);
    else if (job.jobType === 'regenerate_chapter') await processRegenerateChapter(job.id);
  } catch (err) {
    console.error('Job poll error:', err);
  }

  running = false;
}

export function startJobPoller(intervalMs = 3000) {
  setInterval(pollJobs, intervalMs);
  console.log(`Job poller started (interval: ${intervalMs}ms)`);
}
