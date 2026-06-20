import axios from 'axios';
import { ContentType } from '../types';
import { getSystemPrompt } from '../utils/prompts';

export const generateWithDeepSeek = async (
  prompt: string,
  type: ContentType
): Promise<string> => {

  console.log('========== DEEPSEEK ==========');

  console.log(
    'API Key Exists:',
    !!process.env.DEEPSEEK_API_KEY
  );

  console.log(
    'API Key Prefix:',
    process.env.DEEPSEEK_API_KEY?.slice(0, 10)
  );

  try {

    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: getSystemPrompt(type)
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('========== DEEPSEEK SUCCESS ==========');

    console.log(
      JSON.stringify(response.data, null, 2)
    );

    if (
      !response.data?.choices ||
      !response.data.choices.length
    ) {
      throw new Error(
        'DeepSeek returned no choices'
      );
    }

    return response.data.choices[0].message.content;

  } catch (error: any) {

    console.error(
      '========== DEEPSEEK ERROR =========='
    );

    console.error(
      'Status:',
      error?.response?.status
    );

    console.error(
      'Data:',
      JSON.stringify(
        error?.response?.data,
        null,
        2
      )
    );

    console.error(
      'Message:',
      error?.message
    );

    throw error;
  }
};