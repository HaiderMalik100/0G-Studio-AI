import { ContentType } from '../types';

export const enhancePrompt = (prompt: string, type: ContentType): string => {
  const baseContext = `
You are given a user idea or request.

Your job is to transform it into high-quality structured content that feels human-written and professional.

RULES:
- Expand short ideas intelligently and contextually
- Add missing context and relevant details
- Think like a professional ${type} writer with deep expertise
- Never repeat or rehash the user's prompt
- Never stay vague or generic
- Prioritize clarity, specificity, and authenticity
- Include concrete examples where appropriate
`;

  // If user gives very short input → expand it more aggressively
  if (prompt.length < 80) {
    return `
${baseContext}

USER IDEA:
${prompt}

ENHANCEMENT INSTRUCTIONS:
- Expand this into meaningful, detailed ${type} content
- Add practical context and real-world relevance
- Include specific examples or data points
- Make it feel natural, authentic, and specific
- Structure for maximum impact in the ${type} medium
`;
  }

  // If user gives detailed input
  return `
${baseContext}

USER REQUEST:
${prompt}

REFINEMENT INSTRUCTIONS:
- Follow the request carefully and comprehensively
- Improve clarity, structure, and flow
- Add depth without being verbose
- Ensure output feels human-written and authentic
- Optimize for the ${type} format and audience expectations
`;
};