import { NextResponse, NextRequest } from 'next/server';
import OpenAI from 'openai';

// Initialize the OpenAI client with Gaia Node configuration
const openai = new OpenAI({
  baseURL: process.env.GAIA_NODE_URL,
  apiKey: process.env.GAIA_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { castText } = await request.json();

    if (!castText || castText.trim().length === 0) {
      return NextResponse.json({ message: 'Cast text is required.' }, { status: 400 });
    }

    const model = process.env.GAIA_MODEL_NAME || 'gpt-4-turbo';

    // This is the core prompt engineering.
    // We instruct the AI on its role, the tasks to perform, and the exact JSON format to return.
    const systemPrompt = `
      You are an expert Farcaster growth hacker named "QueueAI". Your goal is to help users write more engaging casts.
      Analyze the following Farcaster cast and perform two tasks:
      1. Provide three alternative rewrites. The rewrites should be varied: one more engaging, one more concise, and one that poses a question to the audience. Each rewrite must be 320 characters or less.
      2. Provide an "Engagement Score" from 1 to 100, where 100 is most likely to get high engagement (likes, recasts, replies). Also provide a brief justification for your score.

      You MUST respond with ONLY a valid JSON object in the following format:
      {
        "rewrites": [
          "string",
          "string",
          "string"
        ],
        "engagementScore": {
          "score": number,
          "justification": "string"
        }
      }
    `;

    const completion = await openai.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: castText },
      ],
      response_format: { type: 'json_object' }, // Enforce JSON output
    });

    const aiResponse = completion.choices[0].message.content;

    if (!aiResponse) {
      throw new Error("AI did not return a response.");
    }
    
    // Parse the JSON content from the AI
    const parsedResponse = JSON.parse(aiResponse);

    return NextResponse.json(parsedResponse, { status: 200 });

  } catch (error) {
    console.error('AI Optimization Error:', error);
    return NextResponse.json({ message: 'Failed to get AI suggestions.' }, { status: 500 });
  }
}