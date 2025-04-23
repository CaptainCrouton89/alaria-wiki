import { openai } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { NextResponse } from 'next/server';
import payload from 'payload';
import { z } from 'zod';

export const maxDuration = 30;

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;


export async function POST(req: Request) {
    try {
        if (!OPENAI_API_KEY) {
            return NextResponse.json(
                { error: 'OpenAI API key is not configured' },
                { status: 500 }
            );
        }

        const { messages } = await req.json();

        // Fetch all pages from the database to provide as context
        const pages = await payload.find({
            collection: 'pages',
            limit: 100,
        });

        // Create a context string from all the pages
        const pagesContext = pages.docs.map(page => {
            return `Title: ${page.title}\nSubtitle: ${page.subtitle}\nCategory: ${page.category}\nContent: ${page.markdown}\n\n`;
        }).join('');

        const result = streamText({
            model: openai('gpt-4.1-mini'),
            messages,
            system: `You are a helpful assistant that helps users find information in their wiki. 
      You have access to the following pages in the wiki:
      
      ${pagesContext}
      
      When answering questions, use this information to provide accurate responses. 
      If you don't know the answer based on the provided context, say so.`,
            tools: {
                searchPages: tool({
                    description: 'Search for pages in the wiki',
                    parameters: z.object({
                        query: z.string().describe('The search query to find pages'),
                    }),
                    execute: async ({ query }) => {
                        // Basic search implementation
                        const results = await payload.find({
                            collection: 'pages',
                            where: {
                                or: [
                                    { title: { contains: query } },
                                    { subtitle: { contains: query } },
                                    { markdown: { contains: query } },
                                ],
                            },
                            limit: 5,
                        });

                        return {
                            results: results.docs.map(page => ({
                                title: page.title,
                                subtitle: page.subtitle,
                                summary: page.markdown.slice(0, 150) + '...',
                            })),
                        };
                    },
                }),
            },
        });

        return result.toDataStreamResponse();
    } catch (error) {
        console.error('Error in chat API:', error);
        return NextResponse.json({ error: 'Failed to process chat request' }, { status: 500 });
    }
} 