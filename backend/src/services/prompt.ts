import { ContentType } from '../types';

export const buildPrompt = (userPrompt: string, type: ContentType, tone?: string, audience?: string) => {
  const meta: string[] = [];
  if (tone) meta.push(`Tone: ${tone}`);
  if (audience) meta.push(`Audience: ${audience}`);

  const metaStr = meta.length ? meta.join(' | ') + '\n\n' : '';

  // Strong instruction to prefer structured JSON output to make parsing reliable
  const formatInstruction = `\nOUTPUT FORMAT (preferred): Return a JSON object with the following keys: title, intro, sections (array of {heading, body}), conclusion, bullets (optional array of strings).
If JSON is not possible, return plain text without markdown headers (#), and use blank lines between sections.

Requirements:
- NO markdown headers or code fences
- Clear section breaks with blank lines
- Concrete examples and specific details
- Natural, human-written tone`;

  const template = `${metaStr}${userPrompt}\n\nPlease write a polished ${type} piece. ${formatInstruction}\nWrite like an experienced human writer: natural, concrete, and specific. Avoid generic phrases and AI-like patterns.`;

  return template;
};