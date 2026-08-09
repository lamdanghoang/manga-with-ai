import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.MANGA_API_URL || "https://mangawithai.duckdns.org";

const server = new McpServer({
  name: "MangaWithAI",
  version: "1.0.0",
});

// Tool: Generate a manga story
server.tool(
  "generate_manga",
  "Create an AI-generated manga story from a text prompt. Returns a manga page image URL. Costs $0.01 USDC on Celo Sepolia.",
  {
    prompt: z.string().describe("Story description for the manga (characters, setting, plot)"),
    panelCount: z.number().min(4).max(8).default(4).describe("Number of panels per page (4, 6, or 8)"),
    paymentTxHash: z.string().optional().describe("USDC payment tx hash on Celo Sepolia (required after free tier)"),
    authToken: z.string().describe("JWT token from POST /v1/session/minipay"),
  },
  async ({ prompt, panelCount, paymentTxHash, authToken }) => {
    // Create story
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
    if (paymentTxHash) headers["x-payment-tx"] = paymentTxHash;

    const createRes = await fetch(`${API_URL}/v1/stories`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, stylePreset: "manga-bw", panelCount }),
    });

    if (createRes.status === 402) {
      const payment = await createRes.json();
      return {
        content: [{ type: "text", text: `Payment required: $0.01 USDC to ${payment.payment.payTo} on Celo Sepolia (chainId 44787). Use n-payment SDK:\n\nimport { createPaymentClient } from 'n-payment';\nconst client = createPaymentClient({ chains: ['celo-sepolia'], ows: { wallet: 'manga-agent', privateKey: process.env.CELO_KEY }, celo: { payAsset: 'USDC' } });\nconst res = await client.fetchWithPayment('${API_URL}/v1/stories', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ${authToken}' }, body: JSON.stringify({ prompt: '${prompt}', stylePreset: 'manga-bw', panelCount: ${panelCount} }) });` }],
      };
    }

    if (!createRes.ok) {
      const err = await createRes.json();
      return { content: [{ type: "text", text: `Error: ${err.error}` }] };
    }

    const { jobId, storyId } = await createRes.json();

    // Poll for completion
    let attempts = 0;
    while (attempts < 40) {
      await new Promise((r) => setTimeout(r, 3000));
      const jobRes = await fetch(`${API_URL}/v1/jobs/${jobId}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const job = await jobRes.json();
      if (job.status === "completed" || job.status === "completed_partial") {
        const storyRes = await fetch(`${API_URL}/v1/stories/${storyId}`, { headers: { Authorization: `Bearer ${authToken}` } });
        const story = await storyRes.json();
        const chapterId = story.chapters?.[0]?.id;
        if (chapterId) {
          const chRes = await fetch(`${API_URL}/v1/stories/${storyId}/chapters/${chapterId}`, { headers: { Authorization: `Bearer ${authToken}` } });
          const ch = await chRes.json();
          return {
            content: [
              { type: "text", text: `✅ Manga created: "${story.story.title}"\nImage: ${ch.pageImageUrl}\nStory ID: ${storyId}\nChapter: ${chapterId}` },
            ],
          };
        }
      }
      if (job.status === "failed") {
        return { content: [{ type: "text", text: `❌ Generation failed: ${job.errorMessage}` }] };
      }
      attempts++;
    }
    return { content: [{ type: "text", text: "⏳ Generation timed out. Check story later." }] };
  }
);

// Tool: Continue a story
server.tool(
  "continue_manga",
  "Add a new chapter to an existing manga story. Costs $0.01 USDC on Celo Sepolia.",
  {
    storyId: z.string().describe("Story ID to continue"),
    prompt: z.string().describe("What happens next in the story"),
    paymentTxHash: z.string().optional().describe("USDC payment tx hash"),
    authToken: z.string().describe("JWT auth token"),
  },
  async ({ storyId, prompt, paymentTxHash, authToken }) => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };
    if (paymentTxHash) headers["x-payment-tx"] = paymentTxHash;

    const res = await fetch(`${API_URL}/v1/stories/${storyId}/chapters`, {
      method: "POST",
      headers,
      body: JSON.stringify({ prompt, branchMode: "canon" }),
    });

    if (res.status === 402) {
      return { content: [{ type: "text", text: "Payment required: $0.01 USDC on Celo Sepolia. Provide paymentTxHash." }] };
    }
    if (!res.ok) {
      const err = await res.json();
      return { content: [{ type: "text", text: `Error: ${err.error}` }] };
    }

    const { jobId } = await res.json();
    let attempts = 0;
    while (attempts < 40) {
      await new Promise((r) => setTimeout(r, 3000));
      const jobRes = await fetch(`${API_URL}/v1/jobs/${jobId}`, { headers: { Authorization: `Bearer ${authToken}` } });
      const job = await jobRes.json();
      if (job.status === "completed" || job.status === "completed_partial") {
        return { content: [{ type: "text", text: `✅ New chapter added to story ${storyId}` }] };
      }
      if (job.status === "failed") {
        return { content: [{ type: "text", text: `❌ Failed: ${job.errorMessage}` }] };
      }
      attempts++;
    }
    return { content: [{ type: "text", text: "⏳ Timed out." }] };
  }
);

// Tool: List stories
server.tool(
  "list_manga",
  "List all manga stories created by the authenticated user.",
  { authToken: z.string().describe("JWT auth token") },
  async ({ authToken }) => {
    const res = await fetch(`${API_URL}/v1/stories`, { headers: { Authorization: `Bearer ${authToken}` } });
    const data = await res.json();
    const list = data.items?.map((s: any) => `• ${s.title} (${s.totalChapters} ch, ${s.status})`).join("\n") || "No stories yet.";
    return { content: [{ type: "text", text: list }] };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
