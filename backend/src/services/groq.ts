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

// Minimum word count thresholds by content type
const minWordCount = {
  tweet: 5,
  blog: 100,
  linkedin: 20,
  marketing: 50
};

export const generateWithGroq = async (prompt: string, type: ContentType) => {
  console.log("========== GROQ CALL ==========");

  const cfg = modelConfig[type];
  const minWords = minWordCount[type] || 30;

  const enhancedUserPrompt = enhancePrompt(prompt, type);

  const callGroq = async (isRetry: boolean = false) => {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `
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
            `.trim()
          },
          {
            role: 'system',
            content: getSystemPrompt(type)
          },
          {
            role: 'user',
            content: isRetry
              ? `${enhancedUserPrompt}\n\n[RETRY] Please provide a more comprehensive and detailed response.`
              : enhancedUserPrompt
          }
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

    return response.data.choices[0].message.content;
  };

  // Initial call
  let raw = await callGroq(false);
  const wordCount = raw.split(/\s+/).length;

  // Retry once if output seems too short
  if (wordCount < minWords) {
    console.log(`Output too short (${wordCount} words, min: ${minWords}). Retrying...`);
    raw = await callGroq(true);
  }

  console.log("========== GROQ SUCCESS ==========");

  return formatContent(raw, type);
};