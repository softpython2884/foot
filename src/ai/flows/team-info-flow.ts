
'use server';
/**
 * @fileOverview Provides information about a football team using AI.
 *
 * - getTeamInfo - A function to get general info or answer specific questions about a team.
 * - TeamInfoInput - The input type for the getTeamInfo function.
 * - TeamInfoOutput - The return type for the getTeamInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeamInfoInputSchema = z.object({
  teamName: z.string().describe('The name of the football team.'),
  question: z.string().optional().describe('A specific question about the team.'),
});
export type TeamInfoInput = z.infer<typeof TeamInfoInputSchema>;

const TeamInfoOutputSchema = z.object({
  response: z.string().describe('The AI-generated information or answer about the team.'),
});
export type TeamInfoOutput = z.infer<typeof TeamInfoOutputSchema>;

export async function getTeamInfo(input: TeamInfoInput): Promise<TeamInfoOutput> {
  return teamInfoFlow(input);
}

const teamInfoPrompt = ai.definePrompt({
  name: 'teamInfoPrompt',
  input: {schema: TeamInfoInputSchema},
  output: {schema: TeamInfoOutputSchema},
  prompt: `You are a knowledgeable football expert assistant.
The user is asking about the team: {{{teamName}}}.

{{#if question}}
Please answer the following question specifically about {{{teamName}}}:
"{{{question}}}"
Provide a concise and informative answer. Format your response clearly.
{{else}}
Provide a general, interesting summary about {{{teamName}}}. Include key facts like their league, notable achievements, famous players, or current form if possible. Keep it to a few engaging sentences.
{{/if}}
`,
});

const teamInfoFlow = ai.defineFlow(
  {
    name: 'teamInfoFlow',
    inputSchema: TeamInfoInputSchema,
    outputSchema: TeamInfoOutputSchema,
  },
  async (input) => {
    const {output} = await teamInfoPrompt(input);
    if (!output) {
      return { response: "I'm sorry, I couldn't retrieve information for that team right now. Please try again later." };
    }
    return output;
  }
);

    