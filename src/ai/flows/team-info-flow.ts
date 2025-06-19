
'use server';
/**
 * @fileOverview Provides information about a sports entity (team or player) using AI.
 *
 * - getTeamInfo - A function to get general info or answer specific questions.
 * - TeamInfoInput - The input type for the getTeamInfo function.
 * - TeamInfoOutput - The return type for the getTeamInfo function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TeamInfoInputSchema = z.object({
  entityName: z.string().describe('The name of the sports entity (e.g., football team, F1 constructor, player name).'),
  entityType: z.enum(['team', 'player']).optional().describe("The type of entity. Defaults to 'team' if not specified."),
  contextName: z.string().optional().describe('Optional context, like the team name if entityType is "player", or league if entityType is "team".'),
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
Utilise le format Markdown pour la mise en forme de ta réponse (gras, italique, listes).

{{#if question}}
L'utilisateur s'intéresse à : {{{entityName}}}.
{{#if contextName}}
Contexte supplémentaire : {{{contextName}}}.
{{/if}}
Veuillez répondre spécifiquement à la question suivante :
"{{{question}}}"
Fournis une réponse concise et informative.
{{else if (eq entityType "player")}}
L'utilisateur souhaite une biographie pour le joueur : {{{entityName}}}.
{{#if contextName}}
Ce joueur est associé à l'équipe/contexte : {{{contextName}}}.
{{/if}}
Fournis une biographie concise et intéressante du joueur, incluant des éléments clés comme sa carrière, ses clubs notables, ses réalisations majeures, son style de jeu si pertinent, et des anecdotes intéressantes si possible.
{{else}}
L'utilisateur s'intéresse à l'entité sportive : {{{entityName}}}.
{{#if contextName}}
Contexte supplémentaire (par exemple, ligue) : {{{contextName}}}.
{{/if}}
Fournis un résumé général et intéressant sur {{{entityName}}}.
Adapte le contenu au type d'entité (équipe de football, écurie de F1, équipe de basketball, etc.).
Inclus des faits clés pertinents tels que leur ligue/championnat, réalisations notables, athlètes/pilotes/joueurs célèbres (passés ou présents), lieu d'origine/base, ou leur forme actuelle si possible.
Limite-toi à quelques phrases captivantes et bien formatées.
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
    // Default entityType to 'team' if not provided, especially if a question is asked without specifying type.
    const finalInput = {
      ...input,
      entityType: input.entityType || (input.question ? 'team' : 'team'),
    };
    const {output} = await teamInfoPrompt(finalInput);
    if (!output) {
      return { response: "Je suis désolé, je n'ai pas pu récupérer d'informations pour cette entité pour le moment. Veuillez réessayer plus tard." };
    }
    return output;
  }
);
