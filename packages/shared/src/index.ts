export type StylePreset = 'manga-bw' | 'manga-soft-color';
export type PanelCount = 4 | 6 | 8;
export type StoryStatus = 'draft' | 'ongoing' | 'completed';
export type Visibility = 'private' | 'public' | 'unlisted';
export type JobStatus = 'queued' | 'running' | 'failed' | 'completed';
export type JobType = 'create_story' | 'continue_story' | 'regenerate_chapter' | 'regenerate_panel';
export type ContinuationMode = 'canon' | 'alternate';

export interface CreateStoryRequest {
  prompt: string;
  stylePreset: StylePreset;
  panelCount: PanelCount;
  title?: string;
}

export interface CreateChapterRequest {
  prompt: string;
  branchMode?: ContinuationMode;
}

export interface UpdateStoryRequest {
  title?: string;
  synopsis?: string;
  visibility?: Visibility;
  status?: StoryStatus;
}

export interface SessionRequest {
  walletAddress: string;
  nonce: string;
  signature: string;
  chainId?: number;
}

export interface SessionResponse {
  token: string;
  user: { id: string; walletAddress: string; displayName: string | null };
}

export interface JobResponse {
  id: string;
  status: JobStatus;
  jobType: JobType;
  storyId: string | null;
  chapterId: string | null;
  errorMessage: string | null;
}

export interface StoryCard {
  id: string;
  title: string;
  synopsis: string | null;
  coverImageUrl: string | null;
  visibility: Visibility;
  status: StoryStatus;
  totalChapters: number;
  updatedAt: string;
}

export interface PanelDetail {
  id: string;
  panelNumber: number;
  narrationText: string | null;
  dialogueText: string[];
  imageUrl: string | null;
}

export interface ChapterDetail {
  id: string;
  storyId: string;
  chapterNumber: number;
  title: string | null;
  canonicalSummary: string | null;
  panels: PanelDetail[];
}
