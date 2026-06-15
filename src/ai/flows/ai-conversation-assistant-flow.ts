'use server';
/**
 * @fileOverview This file implements a Genkit flow for an AI conversation assistant.
 * It provides contextual reply suggestions and real-time message translation.
 *
 * - aiConversationAssistant - The main function to call the AI assistant flow.
 * - AIConversationAssistantInput - The input type for the assistant.
 * - AIConversationAssistantOutput - The output type from the assistant.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AIConversationAssistantInputSchema = z.object({
  messageHistory: z
    .array(
      z.object({
        role: z.enum(['sender', 'receiver']),
        text: z.string(),
      })
    )
    .describe('A chronological array of past messages in the conversation.'),
  lastReceivedMessage: z
    .string()
    .describe('The most recent message received from the other participant.'),
  targetLanguage: z
    .string()
    .describe(
      'The language to translate the message into and generate replies in (e.g., "English", "Spanish", "French").'
    ),
});
export type AIConversationAssistantInput = z.infer<
  typeof AIConversationAssistantInputSchema
>;

const AIConversationAssistantOutputSchema = z.object({
  suggestedReplies: z
    .array(z.string())
    .describe('An array of up to three short, contextual reply suggestions in the target language.'),
  translatedMessage: z
    .string()
    .describe('The translation of the last received message into the target language.'),
});
export type AIConversationAssistantOutput = z.infer<
  typeof AIConversationAssistantOutputSchema
>;

export async function aiConversationAssistant(
  input: AIConversationAssistantInput
): Promise<AIConversationAssistantOutput> {
  return aiConversationAssistantFlow(input);
}

const aiConversationAssistantPrompt = ai.definePrompt({
  name: 'aiConversationAssistantPrompt',
  input: {schema: AIConversationAssistantInputSchema},
  output: {schema: AIConversationAssistantOutputSchema},
  prompt: `You are an AI assistant for a mobile messaging app called Zynqo. Your task is to analyze a chat conversation history, translate the last received message into a specified target language, and then suggest up to three short, contextual replies in that same target language.

**Conversation History:**
{{#each messageHistory}}
  {{this.role}}: {{this.text}}
{{/each}}

**Last Received Message:** {{{lastReceivedMessage}}}

**Target Language:** {{{targetLanguage}}}

---

Your output must be a JSON object with two fields:
1.  "translatedMessage": The translation of the "Last Received Message" into the "Target Language".
2.  "suggestedReplies": An array of up to three short, contextual reply suggestions for the "Last Received Message", generated in the "Target Language".

Ensure the suggested replies are concise, relevant to the conversation history and the last message, and grammatically correct in the target language.
`,
});

const aiConversationAssistantFlow = ai.defineFlow(
  {
    name: 'aiConversationAssistantFlow',
    inputSchema: AIConversationAssistantInputSchema,
    outputSchema: AIConversationAssistantOutputSchema,
  },
  async (input) => {
    const {output} = await aiConversationAssistantPrompt(input);
    if (!output) {
      throw new Error('Failed to get output from AI conversation assistant prompt.');
    }
    return output;
  }
);
