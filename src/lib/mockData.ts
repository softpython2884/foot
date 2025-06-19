
import type { League, Team, SportDefinition } from './types';

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-') 
    .replace(/[^\w-]+/g, '') 
    .replace(/--+/g, '-') 
    .replace(/^-+/, '') 
    .replace(/-+$/, ''); 
}

export const supportedSports: SportDefinition[] = [
  {
    name: 'Football',
    slug: 'football',
    apiBaseUrl: 'https://v3.football.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY_FOOTBALL', // We'll use API_SPORTS_KEY for now
    iconUrl: 'https://media.api-sports.io/football/leagues/39.png', // Example: Premier League logo
  },
  {
    name: 'Formula 1',
    slug: 'formula-1',
    apiBaseUrl: 'https://v1.formula-1.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY_FORMULA1',
    iconUrl: 'https://media.api-sports.io/formula-1/leagues/1.png', // Example: F1 logo
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    apiBaseUrl: 'https://v1.basketball.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY_BASKETBALL',
    iconUrl: 'https://media.api-sports.io/basketball/leagues/12.png', // Example: NBA logo
  },
  // Add other sports here later following the same structure
  // API-AFL, API-BASEBALL, API-HANDBALL, API-HOCKEY, API-MMA, API-NFL, API-RUGBY, API-VOLLEYBALL
];


// Teams are now specifically "footballTeams"
export const footballTeams: Team[] = [
  { id: 33, name: 'Manchester United', logoImageUrl: 'https://media.api-sports.io/football/teams/33.png', slug: 'manchester-united', sportSlug: 'football' },
  { id: 40, name: 'Liverpool FC', logoImageUrl: 'https://media.api-sports.io/football/teams/40.png', slug: 'liverpool-fc', sportSlug: 'football' },
  { id: 541, name: 'Real Madrid', logoImageUrl: 'https://media.api-sports.io/football/teams/541.png', slug: 'real-madrid', sportSlug: 'football' },
  { id: 529, name: 'FC Barcelona', logoImageUrl: 'https://media.api-sports.io/football/teams/529.png', slug: 'fc-barcelona', sportSlug: 'football' },
  { id: 496, name: 'Juventus', logoImageUrl: 'https://media.api-sports.io/football/teams/496.png', slug: 'juventus', sportSlug: 'football' },
  { id: 489, name: 'AC Milan', logoImageUrl: 'https://media.api-sports.io/football/teams/489.png', slug: 'ac-milan', sportSlug: 'football' },
  { id: 157, name: 'Bayern Munich', logoImageUrl: 'https://media.api-sports.io/football/teams/157.png', slug: 'bayern-munich', sportSlug: 'football' },
  { id: 165, name: 'Borussia Dortmund', logoImageUrl: 'https://media.api-sports.io/football/teams/165.png', slug: 'borussia-dortmund', sportSlug: 'football' },
  { id: 85, name: 'Paris Saint-Germain', logoImageUrl: 'https://media.api-sports.io/football/teams/85.png', slug: 'paris-saint-germain', sportSlug: 'football' },
  { id: 81, name: 'Olympique de Marseille', logoImageUrl: 'https://media.api-sports.io/football/teams/81.png', slug: 'olympique-de-marseille', sportSlug: 'football' },
  { id: 49, name: 'Chelsea FC', logoImageUrl: 'https://media.api-sports.io/football/teams/49.png', slug: 'chelsea-fc', sportSlug: 'football' },
  { id: 42, name: 'Arsenal FC', logoImageUrl: 'https://media.api-sports.io/football/teams/42.png', slug: 'arsenal-fc', sportSlug: 'football' },
  { id: 530, name: 'Atlético Madrid', logoImageUrl: 'https://media.api-sports.io/football/teams/530.png', slug: 'atletico-madrid', sportSlug: 'football' },
  { id: 505, name: 'Inter Milan', logoImageUrl: 'https://media.api-sports.io/football/teams/505.png', slug: 'inter-milan', sportSlug: 'football' },
  { id: 50, name: 'Manchester City', logoImageUrl: 'https://media.api-sports.io/football/teams/50.png', slug: 'manchester-city', sportSlug: 'football' },
  { id: 47, name: 'Tottenham Hotspur', logoImageUrl: 'https://media.api-sports.io/football/teams/47.png', slug: 'tottenham-hotspur', sportSlug: 'football' },
  { id: 536, name: 'Sevilla FC', logoImageUrl: 'https://media.api-sports.io/football/teams/536.png', slug: 'sevilla-fc', sportSlug: 'football' },
  { id: 492, name: 'Napoli', logoImageUrl: 'https://media.api-sports.io/football/teams/492.png', slug: 'napoli', sportSlug: 'football' },
  { id: 497, name: 'AS Roma', logoImageUrl: 'https://media.api-sports.io/football/teams/497.png', slug: 'as-roma', sportSlug: 'football' },
  { id: 173, name: 'RB Leipzig', logoImageUrl: 'https://media.api-sports.io/football/teams/173.png', slug: 'rb-leipzig', sportSlug: 'football' },
  { id: 91, name: 'AS Monaco', logoImageUrl: 'https://media.api-sports.io/football/teams/91.png', slug: 'as-monaco', sportSlug: 'football' },
  { id: 79, name: 'Lille OSC', logoImageUrl: 'https://media.api-sports.io/football/teams/79.png', slug: 'lille-osc', sportSlug: 'football' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name), sportSlug: 'football' }));


export const footballLeagues: League[] = [
  { id: 39, name: 'Premier League', logoUrl: 'https://media.api-sports.io/football/leagues/39.png', country: 'England', season: 2023, sportSlug: 'football' },
  { id: 140, name: 'La Liga', logoUrl: 'https://media.api-sports.io/football/leagues/140.png', country: 'Spain', season: 2023, sportSlug: 'football' },
  { id: 135, name: 'Serie A', logoUrl: 'https://media.api-sports.io/football/leagues/135.png', country: 'Italy', season: 2023, sportSlug: 'football' },
  { id: 78, name: 'Bundesliga', logoUrl: 'https://media.api-sports.io/football/leagues/78.png', country: 'Germany', season: 2023, sportSlug: 'football' },
  { id: 61, name: 'Ligue 1', logoUrl: 'https://media.api-sports.io/football/leagues/61.png', country: 'France', season: 2023, sportSlug: 'football' },
  { id: 2, name: 'Champions League', logoUrl: 'https://media.api-sports.io/football/leagues/2.png', country: 'Europe', season: 2023, sportSlug: 'football' },
];

// Keep the old 'teams' and 'leagues' export for now to avoid breaking existing imports immediately,
// but they should be phased out or refactored. For now, they'll just point to the football data.
export const teams = footballTeams;
export const leagues = footballLeagues;
