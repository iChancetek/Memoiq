'use server';
/**
 * @fileOverview Chancellor AI - Full Conversational RAG Chat Flow
 *
 * This flow powers Chancellor, the super-intelligent AI assistant for MemoIQ.
 *
 * Pipeline:
 *   1. Embed the user's query (text-embedding-3-small)
 *   2. Query Pinecone for top-k relevant knowledge chunks
 *   3. (Fallback) Run Tavily web search if internal knowledge is insufficient
 *   4. Feed retrieved context + conversation history to GPT-5.4
 *   5. Return Chancellor's response (text + optional TTS audio)
 */

import OpenAI from 'openai';
import { Pinecone } from '@pinecone-database/pinecone';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.OPEN_AI_API_KEY,
});

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY!,
});

const EMBEDDING_MODEL = 'text-embedding-3-small';
const CHAT_MODEL = 'gpt-5.4';
const TOP_K = 5;

// ─── CHANCELLOR SYSTEM PROMPT ─────────────────────────────────────────────────

const CHANCELLOR_SYSTEM_PROMPT = `You are Chancellor — a super-intelligent, conversational AI assistant created by ChanceTEK LLC.

YOUR IDENTITY:
- Name: Chancellor
- Creator: ChanceTEK LLC
- Intelligence: Advanced (powered by GPT-5.4 + RAG)
- Platform: MemoIQ — the AI-powered productivity platform

YOUR PERSONALITY:
- Calm, confident, and highly capable
- Professional yet warm and friendly
- Never robotic — speak naturally, like a brilliant human assistant
- Proactive: suggest features, recommend workflows, guide next steps
- Context-aware: you know what platform the user is on

YOUR CAPABILITIES:
- Deep knowledge of MemoIQ features (tasks, email, calendar, contacts, voice memos, AI insights)
- Deep knowledge of ChanceTEK LLC company vision, technology, and values
- Full knowledge of iChancetek.com content, services, and ecosystem
- Real-time web search for questions beyond your knowledge base
- Voice and text interaction support

CONVERSATIONAL RULES:
1. Always speak naturally and humanly — avoid robotic or overly formal language
2. Be clear, concise, and actionable in your responses
3. Ask intelligent follow-up questions when the user's intent is unclear
4. Proactively suggest relevant features or next steps
5. Maintain conversation context — remember what the user has said
6. If you are unsure about something, say so honestly and look it up
7. Prioritize usefulness above all else

FIRST INTERACTION (if this is the start of a conversation):
"Hi, I'm Chancellor. I can help you with anything on MemoIQ or iChanceTEK. What would you like to do?"

KNOWLEDGE BASE:
Use the retrieved context below to answer accurately. If the context is sufficient, cite from it. 
If not, use your general knowledge or web search results to complete the answer.`;

// ─── TYPES ────────────────────────────────────────────────────────────────────

export interface ChancellorMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChancellorChatInput {
  message: string;
  history: ChancellorMessage[];
  currentPage?: string;    // e.g. '/dashboard', '/calendar'
  userId?: string;
  voiceResponse?: boolean; // Request TTS audio
}

export interface ChancellorChatOutput {
  text: string;
  audioDataUri?: string;
  sources?: string[];
}

// ─── PINECONE RETRIEVAL ───────────────────────────────────────────────────────

async function retrieveContext(query: string): Promise<{ text: string; sources: string[] }> {
  try {
    const index = pinecone.Index(
      process.env.PINECONE_INDEX_NAME || 'memoiq',
      process.env.PINECONE_HOST
    );

    // Embed the query
    const embeddingResponse = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: query,
    });
    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone
    const queryResult = await index.query({
      vector: queryEmbedding,
      topK: TOP_K,
      includeMetadata: true,
    });

    if (!queryResult.matches?.length) {
      return { text: '', sources: [] };
    }

    const sources: string[] = [];
    const contextChunks: string[] = [];

    for (const match of queryResult.matches) {
      if (match.score && match.score < 0.5) continue; // Filter low-relevance matches
      const meta = match.metadata as any;
      if (meta?.text) {
        contextChunks.push(meta.text);
        if (meta?.source && !sources.includes(meta.source)) {
          sources.push(meta.source);
        }
      }
    }

    return {
      text: contextChunks.join('\n\n---\n\n'),
      sources,
    };
  } catch (err: any) {
    console.error('Pinecone retrieval error:', err.message);
    return { text: '', sources: [] };
  }
}

// ─── WEB SEARCH FALLBACK ──────────────────────────────────────────────────────

async function webSearchFallback(query: string): Promise<string> {
  try {
    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) return '';

    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: `${query} site:ichancetek.com OR MemoIQ OR ChanceTEK`,
        search_depth: 'basic',
        max_results: 3,
      }),
    });

    if (!response.ok) return '';
    const data = await response.json();
    
    const snippets = (data.results || [])
      .map((r: any) => `[Source: ${r.url}]\n${r.content}`)
      .join('\n\n');
    
    return snippets;
  } catch {
    return '';
  }
}

// ─── MAIN FLOW ────────────────────────────────────────────────────────────────

export async function chancellorChat(
  input: ChancellorChatInput
): Promise<ChancellorChatOutput> {
  const { message, history, currentPage, voiceResponse } = input;

  // 1. Retrieve relevant knowledge from Pinecone
  const { text: ragContext, sources } = await retrieveContext(message);

  // 2. Optionally supplement with web search if RAG context is thin
  let webContext = '';
  if (ragContext.length < 200) {
    webContext = await webSearchFallback(message);
  }

  // 3. Build the final context block
  const contextBlock = [
    ragContext ? `=== KNOWLEDGE BASE CONTEXT ===\n${ragContext}` : '',
    webContext ? `=== REAL-TIME WEB CONTEXT ===\n${webContext}` : '',
  ]
    .filter(Boolean)
    .join('\n\n');

  // 4. Build system message with context
  const systemMessage = [
    CHANCELLOR_SYSTEM_PROMPT,
    currentPage ? `\nCURRENT PAGE: The user is on: ${currentPage}` : '',
    contextBlock ? `\n\n${contextBlock}` : '',
  ]
    .filter(Boolean)
    .join('');

  // 5. Build message thread (history + current)
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemMessage },
    ...history.map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: message },
  ];

  // 6. Generate response from GPT-5.4
  let responseText = '';
  try {
    const response = await openai.chat.completions.create({
      model: CHAT_MODEL,
      messages,
      temperature: 0.7,
      max_completion_tokens: 800,
    });
    responseText = response.choices[0].message.content || "I'm here to help. What would you like to know?";
  } catch (err: any) {
    console.error('Chancellor chat error:', err.message);
    responseText = "I'm experiencing a brief interruption. Please try again in a moment.";
  }

  // 7. Optionally generate TTS audio
  let audioDataUri: string | undefined;
  if (voiceResponse) {
    try {
      const mp3 = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'onyx', // Deep, confident voice for Chancellor
        input: responseText,
      });
      const buffer = Buffer.from(await mp3.arrayBuffer());
      audioDataUri = `data:audio/mp3;base64,${buffer.toString('base64')}`;
    } catch (err: any) {
      console.warn('Chancellor TTS error:', err.message);
    }
  }

  return {
    text: responseText,
    audioDataUri,
    sources: sources.length > 0 ? sources : undefined,
  };
}
