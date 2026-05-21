-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "wallet_address" VARCHAR(64) NOT NULL,
    "display_name" VARCHAR(80),
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stories" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "synopsis" TEXT,
    "cover_image_url" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ongoing',
    "visibility" VARCHAR(20) NOT NULL DEFAULT 'private',
    "style_preset" VARCHAR(50) NOT NULL DEFAULT 'manga-bw',
    "aspect_ratio" VARCHAR(20) NOT NULL DEFAULT '3:4',
    "total_chapters" INTEGER NOT NULL DEFAULT 0,
    "total_panels" INTEGER NOT NULL DEFAULT 0,
    "public_slug" VARCHAR(220),
    "is_nsfw" BOOLEAN NOT NULL DEFAULT false,
    "moderation_status" VARCHAR(20) NOT NULL DEFAULT 'approved',
    "latest_story_bible_version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_bibles" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "version" INTEGER NOT NULL,
    "logline" TEXT,
    "genre" VARCHAR(80),
    "art_direction" JSONB NOT NULL DEFAULT '{}',
    "world_rules" JSONB NOT NULL DEFAULT '{}',
    "canon_facts" JSONB NOT NULL DEFAULT '[]',
    "open_threads" JSONB NOT NULL DEFAULT '[]',
    "timeline_summary" JSONB NOT NULL DEFAULT '[]',
    "raw_bible" JSONB NOT NULL DEFAULT '{}',
    "created_by" VARCHAR(20) NOT NULL DEFAULT 'system',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_bibles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "characters" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "role" VARCHAR(50),
    "description" TEXT,
    "appearance_traits" JSONB NOT NULL DEFAULT '{}',
    "personality_traits" JSONB NOT NULL DEFAULT '{}',
    "canonical_outfit" JSONB NOT NULL DEFAULT '{}',
    "reference_image_url" TEXT,
    "reference_prompt" TEXT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "characters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "locations" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "visual_traits" JSONB NOT NULL DEFAULT '{}',
    "reference_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "chapter_number" INTEGER NOT NULL,
    "title" VARCHAR(200),
    "user_prompt" TEXT NOT NULL,
    "continuation_mode" VARCHAR(30) NOT NULL DEFAULT 'canon',
    "planner_summary" TEXT,
    "canonical_summary" TEXT,
    "chapter_status" VARCHAR(20) NOT NULL DEFAULT 'published',
    "panel_count" INTEGER NOT NULL DEFAULT 0,
    "cover_panel_asset_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chapter_panels" (
    "id" UUID NOT NULL,
    "chapter_id" UUID NOT NULL,
    "panel_number" INTEGER NOT NULL,
    "narration_text" TEXT,
    "dialogue_text" JSONB NOT NULL DEFAULT '[]',
    "visual_prompt" TEXT NOT NULL,
    "negative_prompt" TEXT,
    "seed" BIGINT,
    "location_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chapter_panels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assets" (
    "id" UUID NOT NULL,
    "owner_user_id" UUID,
    "story_id" UUID,
    "chapter_id" UUID,
    "panel_id" UUID,
    "asset_type" VARCHAR(30) NOT NULL,
    "file_url" TEXT NOT NULL,
    "thumbnail_url" TEXT,
    "mime_type" VARCHAR(100),
    "width" INTEGER,
    "height" INTEGER,
    "file_size_bytes" BIGINT,
    "generation_model" VARCHAR(120),
    "generation_params" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_jobs" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "story_id" UUID,
    "chapter_id" UUID,
    "job_type" VARCHAR(30) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "input_payload" JSONB NOT NULL DEFAULT '{}',
    "output_payload" JSONB NOT NULL DEFAULT '{}',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "started_at" TIMESTAMP(3),
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "generation_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_branches" (
    "id" UUID NOT NULL,
    "story_id" UUID NOT NULL,
    "parent_chapter_id" UUID,
    "name" VARCHAR(120) NOT NULL,
    "branch_type" VARCHAR(20) NOT NULL DEFAULT 'alternate',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_branches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public_story_metrics" (
    "story_id" UUID NOT NULL,
    "view_count" BIGINT NOT NULL DEFAULT 0,
    "unique_view_count" BIGINT NOT NULL DEFAULT 0,
    "share_count" BIGINT NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "public_story_metrics_pkey" PRIMARY KEY ("story_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_wallet_address_key" ON "users"("wallet_address");

-- CreateIndex
CREATE UNIQUE INDEX "stories_public_slug_key" ON "stories"("public_slug");

-- CreateIndex
CREATE UNIQUE INDEX "story_bibles_story_id_version_key" ON "story_bibles"("story_id", "version");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_story_id_chapter_number_key" ON "chapters"("story_id", "chapter_number");

-- CreateIndex
CREATE UNIQUE INDEX "chapter_panels_chapter_id_panel_number_key" ON "chapter_panels"("chapter_id", "panel_number");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_bibles" ADD CONSTRAINT "story_bibles_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "characters" ADD CONSTRAINT "characters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locations" ADD CONSTRAINT "locations_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapters" ADD CONSTRAINT "chapters_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_panels" ADD CONSTRAINT "chapter_panels_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chapter_panels" ADD CONSTRAINT "chapter_panels_location_id_fkey" FOREIGN KEY ("location_id") REFERENCES "locations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_owner_user_id_fkey" FOREIGN KEY ("owner_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_panel_id_fkey" FOREIGN KEY ("panel_id") REFERENCES "chapter_panels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generation_jobs" ADD CONSTRAINT "generation_jobs_chapter_id_fkey" FOREIGN KEY ("chapter_id") REFERENCES "chapters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_branches" ADD CONSTRAINT "story_branches_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public_story_metrics" ADD CONSTRAINT "public_story_metrics_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

