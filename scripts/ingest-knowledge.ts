/**
 * Chancellor AI - Knowledge Ingestion Script
 *
 * This script fetches, chunks, embeds, and upserts knowledge into Pinecone.
 * Run with: npx ts-node --esm scripts/ingest-knowledge.ts
 *
 * Knowledge Sources:
 *  - iChancetek.com (pages)
 *  - MemoIQ internal feature documentation (defined inline)
 */

import { Pinecone } from '@pinecone-database/pinecone';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';
import OpenAI from 'openai';

// Load .env.local manually
const envFile = '.env.local';
if (fs.existsSync(envFile)) {
  const lines = fs.readFileSync(envFile, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx);
      const val = trimmed.slice(idx + 1).replace(/^"|"$/g, '');
      process.env[key] = val;
    }
  }
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 150;
const INDEX_NAME = process.env.PINECONE_INDEX_NAME || 'memoiq';

// ─── KNOWLEDGE SOURCES ───────────────────────────────────────────────────────

const WEB_URLS = [
  'https://www.ichancetek.com',
  'https://www.ichancetek.com/about',
  'https://www.ichancetek.com/services',
  'https://www.ichancetek.com/memoiq',
];

// MemoIQ internal platform documentation (comprehensive)
const INTERNAL_DOCS: { title: string; content: string }[] = [
  {
    title: 'MemoIQ Overview',
    content: `MemoIQ is a super-intelligent productivity platform by ChanceTEK LLC that combines 
AI-powered task management, email, calendar, voice memos, contact management, 
and a conversational AI assistant into a single unified platform. MemoIQ is built 
on a cutting-edge OpenAI and LangGraph agentic AI stack. It supports Google and 
Microsoft 365 multi-account integration for seamless cross-platform productivity.`,
  },
  {
    title: 'MemoIQ Task Management',
    content: `MemoIQ's AI-powered Task Manager lets you create, organize, and prioritize tasks 
using natural language. The AI parses your request, suggests due dates, breaks down 
complex work into subtasks, and links relevant contacts. You can view tasks in list 
or board view, filter by status (pending/completed), and get AI-driven task analysis 
including priority recommendations, risk detection, and productivity suggestions. 
Tasks can be created for both Google and Microsoft 365 accounts.`,
  },
  {
    title: 'MemoIQ Email (Unified Inbox)',
    content: `MemoIQ provides a unified inbox that aggregates emails from all connected Google 
(Gmail) and Microsoft 365 (Outlook) accounts. The AI can summarize emails, draft 
smart replies, extract action items, and send emails on your behalf. MemoIQ's 
multi-account email support means you see all your important messages in one place 
without switching apps. The AI uses RAG to compose context-aware replies.`,
  },
  {
    title: 'MemoIQ Calendar & Scheduling',
    content: `MemoIQ's Smart Calendar combines events from all connected Google Calendar and 
Microsoft 365 accounts. You can create new events, schedule appointments using 
natural language (e.g., "Schedule a meeting with John next Tuesday at 2pm"), and 
the AI checks for conflicts before booking. The AI also provides daily briefings 
about upcoming events and meetings, and helps optimize your schedule proactively.`,
  },
  {
    title: 'MemoIQ Voice Memos (iSkylar)',
    content: `MemoIQ's Voice Memo feature (powered by iSkylar) lets you record voice notes which 
are then transcribed using OpenAI Whisper (high-accuracy speech-to-text) and 
summarized using GPT-5.4. You can browse your memos, search transcriptions, and 
the AI companion iSkylar helps you process your thoughts. Voice interactions are 
powered by OpenAI TTS for natural-sounding voice responses.`,
  },
  {
    title: 'MemoIQ Contact Management',
    content: `MemoIQ's Contact Manager syncs contacts from Google and Microsoft 365. You can add 
new contacts using natural language (e.g., "Add John Smith, CEO at Acme Corp, 
john@acme.com"), and the AI parses the details automatically. The AI also provides 
Contact Insights — suggesting which contacts to follow up with based on last contact 
date and relationship context. Contacts are fully searchable by the Chancellor AI agent.`,
  },
  {
    title: 'MemoIQ AI Assistant (Chancellor & iSkylar)',
    content: `MemoIQ features two AI personas. Chancellor is the super-intelligent RAG-powered 
conversational assistant that can answer any question about MemoIQ features, 
ChanceTEK LLC, and iChancetek.com. iSkylar is the empathetic voice companion 
for emotional support, wellness, and motivational guidance. Both use GPT-5.4 as 
the core reasoning engine. Chancellor uses Pinecone vector search to retrieve 
accurate knowledge before generating responses.`,
  },
  {
    title: 'MemoIQ Microsoft 365 Multi-Account Support',
    content: `MemoIQ supports connecting multiple Microsoft 365 (Outlook/Office) accounts. 
Each account's emails, calendar events, and contacts are synced and unified in 
the MemoIQ dashboard. You can add new M365 accounts through Settings > Accounts > 
Add Microsoft Account, which triggers an OAuth 2.0 flow via the Microsoft Identity 
Platform. Token refresh is handled automatically so your accounts stay in sync.`,
  },
  {
    title: 'MemoIQ Google Multi-Account Support',
    content: `MemoIQ supports connecting multiple Google accounts (Gmail + Google Calendar). 
Email, events, and contacts from all linked Google accounts are automatically 
synced. Multi-account Google support allows you to manage personal and professional 
Google accounts side by side within MemoIQ without switching between accounts.`,
  },
  {
    title: 'MemoIQ Daily Briefing',
    content: `The MemoIQ Daily Briefing is an AI-generated summary of your day, combining 
upcoming calendar events (from all accounts), high-priority tasks, and recent 
emails into a concise briefing. The briefing is also read aloud using OpenAI TTS 
for a hands-free morning experience. The AI proactively surfaces what matters most 
to keep you focused and productive.`,
  },
  {
    title: 'ChanceTEK LLC Overview',
    content: `ChanceTEK LLC is a technology company founded on the vision of making advanced 
AI accessible and practical for everyday work. ChanceTEK builds AI-native platforms 
that blend cutting-edge AI research with intuitive user experiences. MemoIQ is the 
flagship productivity platform. ChanceTEK is committed to continuous innovation in 
agentic AI, multi-modal interfaces, and enterprise-grade security.`,
  },
  {
    title: 'iChancetek.com Platform Ecosystem',
    content: `iChancetek.com is the digital home of ChanceTEK LLC. The website showcases 
ChanceTEK's full suite of AI-powered products and services, including MemoIQ. 
It contains detailed feature descriptions, use cases, company vision, technology 
stack details, and contact information. The Chancellor AI uses all iChancetek.com 
content as part of its RAG knowledge base to provide accurate, up-to-date answers.`,
  },
];

// ─── CHUNKING ─────────────────────────────────────────────────────────────────

function chunkText(text: string, size = CHUNK_SIZE, overlap = CHUNK_OVERLAP): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + size, text.length);
    chunks.push(text.slice(start, end).trim());
    start += size - overlap;
  }
  return chunks.filter(c => c.length > 50);
}

function splitByHeadings(text: string): string[] {
  // Split on heading-like patterns: lines that are all caps, start with numbers, or markdown h2/h3
  const sections = text.split(/\n(?=#{1,3}\s|\d+\.\s|[A-Z][A-Z ]{5,}\n)/);
  const result: string[] = [];
  for (const section of sections) {
    if (section.length <= CHUNK_SIZE) {
      result.push(section.trim());
    } else {
      result.push(...chunkText(section));
    }
  }
  return result.filter(c => c.length > 50);
}

// ─── FETCHING ─────────────────────────────────────────────────────────────────

async function fetchPageText(url: string): Promise<string> {
  try {
    console.log(`  Fetching: ${url}`);
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'Mozilla/5.0 Chancellor-AI-Bot/1.0' },
      signal: AbortSignal.timeout(15000)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const $ = cheerio.load(html);
    
    // Remove non-content elements
    $('script, style, nav, footer, header, [class*="cookie"], [class*="banner"], [aria-hidden="true"]').remove();
    
    // Extract main content
    const main = $('main, article, [role="main"], .content, #content').text()
      || $('body').text();
    
    return main.replace(/\s+/g, ' ').trim();
  } catch (err: any) {
    console.warn(`  Could not fetch ${url}: ${err.message}`);
    return '';
  }
}

// ─── EMBEDDING ────────────────────────────────────────────────────────────────

async function embedBatch(texts: string[]): Promise<number[][]> {
  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: texts,
  });
  return response.data.map(d => d.embedding);
}

// ─── MAIN INGESTION ───────────────────────────────────────────────────────────

async function ingest() {
  console.log('\n🚀 Chancellor AI - Knowledge Ingestion Started\n');

  const index = pinecone.Index(INDEX_NAME, process.env.PINECONE_HOST);

  const allChunks: { id: string; text: string; source: string }[] = [];

  // 1. Process internal MemoIQ documentation
  console.log('📚 Processing internal MemoIQ documentation...');
  for (const doc of INTERNAL_DOCS) {
    const chunks = splitByHeadings(doc.content);
    chunks.forEach((chunk, i) => {
      allChunks.push({
        id: `memoiq-${doc.title.toLowerCase().replace(/\s+/g, '-')}-${i}`,
        text: `${doc.title}\n\n${chunk}`,
        source: 'memoiq-docs',
      });
    });
    console.log(`  ✅ ${doc.title}: ${chunks.length} chunk(s)`);
  }

  // 2. Fetch and process web pages
  console.log('\n🌐 Fetching web content from iChancetek.com...');
  for (const url of WEB_URLS) {
    const pageText = await fetchPageText(url);
    if (!pageText) continue;
    const chunks = splitByHeadings(pageText);
    const urlKey = url.replace(/https?:\/\//, '').replace(/\//g, '-');
    chunks.slice(0, 30).forEach((chunk, i) => { // cap at 30 chunks per page
      allChunks.push({
        id: `web-${urlKey}-${i}`,
        text: chunk,
        source: url,
      });
    });
    console.log(`  ✅ ${url}: ${Math.min(chunks.length, 30)} chunk(s)`);
  }

  console.log(`\n🔢 Total chunks to embed & upsert: ${allChunks.length}\n`);

  // 3. Embed in batches and upsert to Pinecone
  const BATCH_SIZE = 20;
  let upserted = 0;

  for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
    const batch = allChunks.slice(i, i + BATCH_SIZE);
    try {
      const embeddings = await embedBatch(batch.map(c => c.text));
      
      const vectors = batch.map((chunk, j) => ({
        id: chunk.id,
        values: embeddings[j],
        metadata: {
          text: chunk.text.slice(0, 1000), // Pinecone metadata limit
          source: chunk.source,
        },
      }));

      // @ts-ignore — upsert accepts array in Pinecone SDK v3+
      await (index as any).upsert(vectors);
      upserted += vectors.length;
      console.log(`  ✅ Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${upserted}/${allChunks.length} vectors`);
    } catch (err: any) {
      console.error(`  ❌ Failed batch at index ${i}:`, err.message);
    }
  }

  console.log(`\n✅ Ingestion complete! ${upserted} vectors stored in Pinecone.\n`);
  console.log('Chancellor AI is ready to answer questions about MemoIQ & ChanceTEK.\n');
}

ingest().catch(console.error);
