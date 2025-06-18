
import type { League, Team } from './types'; // Team will now include API ID

// Helper function to generate slugs
function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w-]+/g, '') // Remove all non-word chars
    .replace(/--+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

// These are primarily for the homepage display and linking to team pages.
// The `id` here is the API-Sports ID.
export const teams: Team[] = [
  { id: 33, name: 'Manchester United', logoImageUrl: 'https://media.api-sports.io/football/teams/33.png', slug: 'manchester-united' },
  { id: 40, name: 'Liverpool FC', logoImageUrl: 'https://media.api-sports.io/football/teams/40.png', slug: 'liverpool-fc' },
  { id: 541, name: 'Real Madrid', logoImageUrl: 'https://media.api-sports.io/football/teams/541.png', slug: 'real-madrid' },
  { id: 529, name: 'FC Barcelona', logoImageUrl: 'https://media.api-sports.io/football/teams/529.png', slug: 'fc-barcelona' },
  { id: 496, name: 'Juventus', logoImageUrl: 'https://media.api-sports.io/football/teams/496.png', slug: 'juventus' },
  { id: 489, name: 'AC Milan', logoImageUrl: 'https://media.api-sports.io/football/teams/489.png', slug: 'ac-milan' },
  { id: 157, name: 'Bayern Munich', logoImageUrl: 'https://media.api-sports.io/football/teams/157.png', slug: 'bayern-munich' },
  { id: 165, name: 'Borussia Dortmund', logoImageUrl: 'https://media.api-sports.io/football/teams/165.png', slug: 'borussia-dortmund' },
  { id: 85, name: 'Paris Saint-Germain', logoImageUrl: 'https://media.api-sports.io/football/teams/85.png', slug: 'paris-saint-germain' },
  { id: 81, name: 'Olympique de Marseille', logoImageUrl: 'https://media.api-sports.io/football/teams/81.png', slug: 'olympique-de-marseille' },
  { id: 49, name: 'Chelsea FC', logoImageUrl: 'https://media.api-sports.io/football/teams/49.png', slug: 'chelsea-fc' },
  { id: 42, name: 'Arsenal FC', logoImageUrl: 'https://media.api-sports.io/football/teams/42.png', slug: 'arsenal-fc' },
  { id: 530, name: 'Atlético Madrid', logoImageUrl: 'https://media.api-sports.io/football/teams/530.png', slug: 'atletico-madrid' },
  { id: 505, name: 'Inter Milan', logoImageUrl: 'https://media.api-sports.io/football/teams/505.png', slug: 'inter-milan' },
  { id: 50, name: 'Manchester City', logoImageUrl: 'https://media.api-sports.io/football/teams/50.png', slug: 'manchester-city' },
  { id: 47, name: 'Tottenham Hotspur', logoImageUrl: 'https://media.api-sports.io/football/teams/47.png', slug: 'tottenham-hotspur' },
  { id: 536, name: 'Sevilla FC', logoImageUrl: 'https://media.api-sports.io/football/teams/536.png', slug: 'sevilla-fc' },
  { id: 492, name: 'Napoli', logoImageUrl: 'https://media.api-sports.io/football/teams/492.png', slug: 'napoli' },
  { id: 497, name: 'AS Roma', logoImageUrl: 'https://media.api-sports.io/football/teams/497.png', slug: 'as-roma' },
  { id: 173, name: 'RB Leipzig', logoImageUrl: 'https://media.api-sports.io/football/teams/173.png', slug: 'rb-leipzig' },
  { id: 91, name: 'AS Monaco', logoImageUrl: 'https://media.api-sports.io/football/teams/91.png', slug: 'as-monaco' },
  { id: 79, name: 'Lille OSC', logoImageUrl: 'https://media.api-sports.io/football/teams/79.png', slug: 'lille-osc' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name) }));

export const leagues: League[] = [
  { id: 39, name: 'Premier League', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', season: 2023 },
  { id: 140, name: 'La Liga', logoUrl: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', season: 2023 },
  { id: 135, name: 'Serie A', logoUrl: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', season: 2023 },
  { id: 78, name: 'Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', season: 2023 },
  { id: 61, name: 'Ligue 1', logoUrl: 'https://media.api-sports.io/football/leagues/61.png', country: 'France', season: 2023 },
  { id: 2, name: 'Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', season: 2023 },
];

