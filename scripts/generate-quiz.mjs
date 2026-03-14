import 'dotenv/config';
import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';
import OpenAI from 'openai';
import { parseArgs } from 'util';

const { values: args } = parseArgs({
  options: {
    provider: { type: 'string', default: 'openrouter' },
    model: { type: 'string' },
    input: { type: 'string', default: 'content/docs' },
    output: { type: 'string', default: 'src/data/questions' },
    limit: { type: 'string' },
    force: { type: 'boolean', default: false },
  },
});

const provider = args.provider;
const limit = args.limit ? parseInt(args.limit, 10) : Infinity;
const force = args.force;
const inputDir = args.input;
const outputDir = args.output;

const defaultModels = {
  openrouter: 'anthropic/claude-sonnet-4',
  ollama: 'llama3.1',
};

const model = args.model ?? defaultModels[provider] ?? defaultModels.openrouter;

function getClient() {
  if (provider === 'ollama') {
    const baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    return new OpenAI({ baseURL: `${baseURL}/v1`, apiKey: 'ollama' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('Error: OPENROUTER_API_KEY not set in .env');
    process.exit(1);
  }
  return new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey,
  });
}

const SYSTEM_PROMPT = `You are a quiz question generator for the Notion Help Center. Given a markdown article, generate multiple-choice questions that test understanding of the content.

Return ONLY valid JSON matching this schema:
{
  "source": "filename-without-extension",
  "sourceTitle": "Human readable title from the article",
  "sourceUrl": "https://www.notion.so/help/SLUG",
  "questions": [
    {
      "id": "SLUG-001",
      "question": "Question text",
      "difficulty": "easy|medium|hard",
      "options": [
        { "key": "A", "text": "Option text", "correct": false, "explanation": "Why this is wrong" },
        { "key": "B", "text": "Option text", "correct": true, "explanation": "Why this is correct" },
        { "key": "C", "text": "Option text", "correct": false, "explanation": "Why this is wrong" },
        { "key": "D", "text": "Option text", "correct": false, "explanation": "Why this is wrong" }
      ]
    }
  ]
}

Rules:
- Generate 5-15 questions depending on article length and depth
- Each question must have exactly 4 options with exactly 1 correct answer
- Mix difficulty levels: ~30% easy, ~50% medium, ~20% hard
- Questions should test understanding, not just recall
- Explanations should teach — explain why the correct answer is right and why wrong answers are wrong
- Use the article slug as the source filename
- IDs must be unique: use slug prefix + sequential number (e.g., "intro-to-databases-001")
- Return ONLY the JSON, no markdown fences or other text`;

async function generateForFile(client, filename, content) {
  const slug = basename(filename, '.md');
  const userPrompt = `Generate quiz questions for this Notion Help Center article:\n\nFilename: ${filename}\n\n${content}`;

  const response = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
  });

  const text = response.choices[0]?.message?.content?.trim() ?? '';

  // Strip markdown fences if present
  const jsonText = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');

  return JSON.parse(jsonText);
}

async function main() {
  console.log(`\nNotion Quiz Generator`);
  console.log(`Provider: ${provider} | Model: ${model}\n`);

  if (!existsSync(inputDir)) {
    console.error(`Input directory not found: ${inputDir}`);
    process.exit(1);
  }

  await mkdir(outputDir, { recursive: true });

  const files = (await readdir(inputDir))
    .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    .sort();

  const toProcess = files.slice(0, limit);
  console.log(`Processing ${toProcess.length} of ${files.length} files\n`);

  const client = getClient();
  const allFiles = [];
  let processed = 0;
  let skipped = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const file = toProcess[i];
    const slug = basename(file, '.md');
    const outPath = join(outputDir, `${slug}.json`);

    if (!force && existsSync(outPath)) {
      try {
        const existing = JSON.parse(await readFile(outPath, 'utf-8'));
        allFiles.push(existing);
        skipped++;
        console.log(`[${i + 1}/${toProcess.length}] Skipping (exists): ${file}`);
        continue;
      } catch {
        // invalid existing file, regenerate
      }
    }

    const content = await readFile(join(inputDir, file), 'utf-8');

    let result;
    try {
      result = await generateForFile(client, file, content);
    } catch (err) {
      console.log(`[${i + 1}/${toProcess.length}] First attempt failed for ${file}, retrying...`);
      try {
        result = await generateForFile(client, file, content);
      } catch (err2) {
        console.warn(`[${i + 1}/${toProcess.length}] Skipping ${file}: ${err2.message}`);
        continue;
      }
    }

    await writeFile(outPath, JSON.stringify(result, null, 2));
    allFiles.push(result);
    processed++;

    const qCount = result.questions?.length ?? 0;
    console.log(`[${i + 1}/${toProcess.length}] Generated: ${file} (${qCount} questions)`);

    // Rate limit delay
    if (i < toProcess.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Generate catalog
  const totalQuestions = allFiles.reduce(
    (sum, f) => sum + (f.questions?.length ?? 0),
    0
  );

  const catalog = {
    generatedAt: new Date().toISOString(),
    totalQuestions,
    files: allFiles,
  };

  await writeFile(
    join(outputDir, '_catalog.json'),
    JSON.stringify(catalog, null, 2)
  );

  console.log(`\nDone! Processed: ${processed}, Skipped: ${skipped}`);
  console.log(`Total questions: ${totalQuestions}`);
  console.log(`Catalog: ${join(outputDir, '_catalog.json')}`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
