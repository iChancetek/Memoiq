import * as fs from 'fs';

// Load .env.local manually BEFORE imports
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

async function runTest() {
  // Dynamic import to ensure env is loaded first
  const { chancellorChat } = await import('../src/ai/flows/chancellor-chat');

  console.log('🧪 Testing Chancellor AI RAG Flow...\n');

  const sampleQuery = 'What is MemoIQ and who created it?';
  console.log(`User: "${sampleQuery}"`);

  try {
    const result = await chancellorChat({
      message: sampleQuery,
      history: [],
      currentPage: '/dashboard',
    });

    console.log('\n🤖 Chancellor:');
    console.log(result.text);

    if (result.sources) {
      console.log('\n📚 Sources:', result.sources.join(', '));
    } else {
      console.log('\n📚 Sources: None');
    }

  } catch (err: any) {
    console.error('❌ Test failed:', err.message);
  }
}

runTest();
