
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
  prompt: `Réponds toujours en français. Tu es un assistant expert en football très compétent.
L'utilisateur pose une question sur l'équipe : {{{teamName}}}.

{{#if question}}
Veuillez répondre spécifiquement à la question suivante concernant {{{teamName}}} :
"{{{question}}}"
Fournissez une réponse concise et informative. Formatez clairement votre réponse.
{{else}}
Fournissez un résumé général et intéressant sur {{{teamName}}}. Incluez des faits clés comme leur ligue, leurs réalisations notables, les joueurs célèbres ou leur forme actuelle si possible. Limitez-vous à quelques phrases captivantes.
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
      return { response: "Je suis désolé, je n'ai pas pu récupérer d'informations pour cette équipe pour le moment. Veuillez réessayer plus tard." };
    }
    return output;
  }
);
