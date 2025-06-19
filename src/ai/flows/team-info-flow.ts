
'use server';
/**
 * @fileOverview Provides information about a sports entity using AI.
 *
 * - getTeamInfo - A function to get general info or answer specific questions about a sports entity.
 * - TeamInfoInput - The input type for the getTeamInfo function.
 * - TeamInfoOutput - The return type for the getTeamInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeamInfoInputSchema = z.object({
  teamName: z.string().describe('The name of the sports entity (e.g., football team, F1 constructor, basketball team).'),
  question: z.string().optional().describe('A specific question about the entity.'),
});
export type TeamInfoInput = z.infer<typeof TeamInfoInputSchema>;

const TeamInfoOutputSchema = z.object({
  response: z.string().describe('The AI-generated information or answer about the entity, potentially using Markdown for formatting.'),
});
export type TeamInfoOutput = z.infer<typeof TeamInfoOutputSchema>;

export async function getTeamInfo(input: TeamInfoInput): Promise<TeamInfoOutput> {
  return teamInfoFlow(input);
}

const teamInfoPrompt = ai.definePrompt({
  name: 'teamInfoPrompt',
  input: {schema: TeamInfoInputSchema},
  output: {schema: TeamInfoOutputSchema},
  prompt: `Réponds toujours en français. Tu es un assistant expert en sport très compétent.
L'utilisateur s'intéresse à l'entité sportive : {{{teamName}}}.
Utilise le format Markdown pour la mise en forme de ta réponse. Par exemple, tu peux mettre des informations importantes en **gras** ou en *italique*. Pour les listes, utilise des tirets ou des numéros.

{{#if question}}
Veuillez répondre spécifiquement à la question suivante concernant {{{teamName}}} :
"{{{question}}}"
Fournis une réponse concise et informative, en utilisant Markdown pour la clarté.
{{else}}
Fournis un résumé général et intéressant sur {{{teamName}}}. Selon le type d'entité (équipe de football, écurie de F1, équipe de basketball, etc.), inclus des faits clés pertinents tels que leur ligue/championnat, leurs réalisations notables, les athlètes/pilotes/joueurs célèbres (passés ou présents), leur lieu d'origine/base, ou leur forme actuelle si possible. Limite-toi à quelques phrases captivantes et bien formatées avec Markdown.
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
      return { response: "Je suis désolé, je n'ai pas pu récupérer d'informations pour cette entité pour le moment. Veuillez réessayer plus tard." };
    }
    return output;
  }
);

