import axios from 'axios';
import { ContentType } from '../types';
import { getSystemPrompt } from '../utils/prompts';
import { formatContent } from './contentFormatter';
import { enhancePrompt } from './promptEnhancer';

const modelConfig = {
  tweet: { temperature: 1.1, max_tokens: 450 },
  blog: { temperature: 0.8, max_tokens: 2500 },
  linkedin: { temperature: 0.9, max_tokens: 1200 },
  marketing: { temperature: 1.0, max_tokens: 1000 }
};

const minWordCount = {
  tweet: 5,
  blog: 100,
  linkedin: 20,
  marketing: 50
};

const SYSTEM_BASE = `
You are an elite human-level content creator.

You do deep thinking before writing.
You avoid AI patterns completely.
You write like a real expert with experience.

Your output must feel:
- natural
- structured
- emotionally intelligent
- ready for publishing

Never produce generic content.
`.trim();

const callGemini = async (systemPrompt: string, userPrompt: string, cfg: any) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const res = await axios.post(url, {
    contents: [
      {
        role: 'user',
        parts: [{ text: `${SYSTEM_BASE}\n\n${systemPrompt}\n\n${userPrompt}` }]
      }
    ],
    generationConfig: {
      temperature: cfg.temperature,
      maxOutputTokens: cfg.max_tokens
    }
  }, {
    headers: { 'Content-Type': 'application/json' }
  });

  return res.data.candidates[0].content.parts[0].text;
};

const callGroq = async (systemPrompt: string, userPrompt: string, cfg: any) => {
  const res = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: SYSTEM_BASE },
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: cfg.temperature,
      max_tokens: cfg.max_tokens
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  return res.data.choices[0].message.content;
};

export const generateWithAI = async (prompt: string, type: ContentType) => {
  console.log("========== AI CALL ==========");

  const cfg = modelConfig[type];
  const minWords = minWordCount[type] || 30;
  const systemPrompt = getSystemPrompt(type);
  const enhancedUserPrompt = enhancePrompt(prompt, type);

  const generate = async (isRetry: boolean = false) => {
    const userPrompt = isRetry
     ? `${enhancedUserPrompt}\n\n[RETRY] Please provide a more comprehensive and detailed response.`
      : enhancedUserPrompt;

    // Try Gemini first, fallback to Groq
    try {
      if (process.env.GEMINI_API_KEY) {
        console.log('Using Gemini...');
        return await callGemini(systemPrompt, userPrompt, cfg);
      }
    } catch (e: any) {
      console.warn('Gemini failed:', e.message);
    }

    try {
      if (process.env.GROQ_API_KEY) {
        console.log('Using Groq...');
        return await callGroq(systemPrompt, userPrompt, cfg);
      }
    } catch (e: any) {
      console.error('Groq failed:', e.message);
      throw new Error('All AI providers failed');
    }

    throw new Error('No AI API keys configured');
  };

  let raw = await generate(false);
  let wordCount = raw.split(/\s+/).length;

  if (wordCount < minWords) {
    console.log(`Output too short (${wordCount} words, min: ${minWords}). Retrying...`);
    raw = await generate(true);
  }

  console.log("========== AI SUCCESS ==========");
  return formatContent(raw, type);
};
