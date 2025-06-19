
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
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://placehold.co/400x300.png',
  },
  {
    name: 'Formule 1',
    slug: 'formula-1',
    apiBaseUrl: 'https://v1.formula-1.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://placehold.co/400x300.png',
  },
  {
    name: 'Basketball',
    slug: 'basketball',
    apiBaseUrl: 'https://v1.basketball.api-sports.io',
    apiKeyHeaderName: 'x-apisports-key',
    apiKeyEnvVar: 'API_SPORTS_KEY',
    iconUrl: 'https://placehold.co/400x300.png',
  },
];


// Football Teams - using 'logoUrl' now
export const footballTeams: Team[] = [
  { id: 33, name: 'Manchester United', logoUrl: 'https://media.api-sports.io/football/teams/33.png', sportSlug: 'football' },
  { id: 40, name: 'Liverpool FC', logoUrl: 'https://media.api-sports.io/football/teams/40.png', sportSlug: 'football' },
  { id: 541, name: 'Real Madrid', logoUrl: 'https://media.api-sports.io/football/teams/541.png', sportSlug: 'football' },
  { id: 529, name: 'FC Barcelona', logoUrl: 'https://media.api-sports.io/football/teams/529.png', sportSlug: 'football' },
  { id: 496, name: 'Juventus', logoUrl: 'https://media.api-sports.io/football/teams/496.png', sportSlug: 'football' },
  { id: 489, name: 'AC Milan', logoUrl: 'https://media.api-sports.io/football/teams/489.png', sportSlug: 'football' },
  { id: 157, name: 'Bayern Munich', logoUrl: 'https://media.api-sports.io/football/teams/157.png', sportSlug: 'football' },
  { id: 165, name: 'Borussia Dortmund', logoUrl: 'https://media.api-sports.io/football/teams/165.png', sportSlug: 'football' },
  { id: 85, name: 'Paris Saint-Germain', logoUrl: 'https://media.api-sports.io/football/teams/85.png', sportSlug: 'football' },
  { id: 81, name: 'Olympique de Marseille', logoUrl: 'https://media.api-sports.io/football/teams/81.png', sportSlug: 'football' },
  { id: 49, name: 'Chelsea FC', logoUrl: 'https://media.api-sports.io/football/teams/49.png', sportSlug: 'football' },
  { id: 42, name: 'Arsenal FC', logoUrl: 'https://media.api-sports.io/football/teams/42.png', sportSlug: 'football' },
  { id: 530, name: 'Atlético Madrid', logoUrl: 'https://media.api-sports.io/football/teams/530.png', sportSlug: 'football' },
  { id: 505, name: 'Inter Milan', logoUrl: 'https://media.api-sports.io/football/teams/505.png', sportSlug: 'football' },
  { id: 50, name: 'Manchester City', logoUrl: 'https://media.api-sports.io/football/teams/50.png', sportSlug: 'football' },
  { id: 47, name: 'Tottenham Hotspur', logoUrl: 'https://media.api-sports.io/football/teams/47.png', sportSlug: 'football' },
  { id: 536, name: 'Sevilla FC', logoUrl: 'https://media.api-sports.io/football/teams/536.png', sportSlug: 'football' },
  { id: 492, name: 'Napoli', logoUrl: 'https://media.api-sports.io/football/teams/492.png', sportSlug: 'football' },
  { id: 497, name: 'AS Roma', logoUrl: 'https://media.api-sports.io/football/teams/497.png', sportSlug: 'football' },
  { id: 173, name: 'RB Leipzig', logoUrl: 'https://media.api-sports.io/football/teams/173.png', sportSlug: 'football' },
  { id: 91, name: 'AS Monaco', logoUrl: 'https://media.api-sports.io/football/teams/91.png', sportSlug: 'football' },
  { id: 79, name: 'Lille OSC', logoUrl: 'https://media.api-sports.io/football/teams/79.png', sportSlug: 'football' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name) }));


// Formula 1 Entities (Constructors)
export const formula1Entities: Team[] = [
  { id: 1001, name: 'Mercedes-AMG Petronas', logoUrl: 'https://media.api-sports.io/formula-1/teams/5.png', sportSlug: 'formula-1', base: 'Brackley, UK', championships: 8 },
  { id: 1002, name: 'Scuderia Ferrari', logoUrl: 'https://media.api-sports.io/formula-1/teams/3.png', sportSlug: 'formula-1', base: 'Maranello, Italy', championships: 16 },
  { id: 1003, name: 'Red Bull Racing', logoUrl: 'https://media.api-sports.io/formula-1/teams/1.png', sportSlug: 'formula-1', base: 'Milton Keynes, UK', championships: 6 },
  { id: 1004, name: 'McLaren F1 Team', logoUrl: 'https://media.api-sports.io/formula-1/teams/2.png', sportSlug: 'formula-1', base: 'Woking, UK', championships: 8 },
  { id: 1005, name: 'Alpine F1 Team', logoUrl: 'https://media.api-sports.io/formula-1/teams/10.png', sportSlug: 'formula-1', base: 'Enstone, UK', championships: 2 },
  { id: 1006, name: 'Aston Martin Cognizant', logoUrl: 'https://media.api-sports.io/formula-1/teams/8.png', sportSlug: 'formula-1', base: 'Silverstone, UK' },
].map(entity => ({ ...entity, slug: entity.slug || slugify(entity.name) }));

// Basketball Teams (NBA Examples)
export const basketballTeams: Team[] = [
  { id: 2001, name: 'Los Angeles Lakers', logoUrl: 'https://media.api-sports.io/basketball/teams/133.png', sportSlug: 'basketball', conference: 'Western', division: 'Pacific' },
  { id: 2002, name: 'Golden State Warriors', logoUrl: 'https://media.api-sports.io/basketball/teams/129.png', sportSlug: 'basketball', conference: 'Western', division: 'Pacific' },
  { id: 2003, name: 'Boston Celtics', logoUrl: 'https://media.api-sports.io/basketball/teams/120.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Atlantic' },
  { id: 2004, name: 'Chicago Bulls', logoUrl: 'https://media.api-sports.io/basketball/teams/123.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Central' },
  { id: 2005, name: 'Miami Heat', logoUrl: 'https://media.api-sports.io/basketball/teams/136.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Southeast' },
  { id: 2006, name: 'Milwaukee Bucks', logoUrl: 'https://media.api-sports.io/basketball/teams/138.png', sportSlug: 'basketball', conference: 'Eastern', division: 'Central' },
].map(team => ({ ...team, slug: team.slug || slugify(team.name) }));


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

    