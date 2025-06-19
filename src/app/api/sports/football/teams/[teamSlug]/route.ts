
import { NextResponse } from 'next/server';
import { footballTeams, supportedSports } from '@/lib/mockData';
import { 
  getFootballTeamDetails, 
  getFootballMatchesForTeam,
  getFootballCoachForTeam,
  getFootballSquadForTeam
} from '@/services/apiSportsService';
import { getTeamInfo } from '@/ai/flows/team-info-flow';
import type { TeamApp, MatchApp, CoachApp, PlayerApp, SportDefinition } from '@/lib/types';

const FOOTBALL_API_BASE_URL = supportedSports.find(s => s.slug === 'football')?.apiBaseUrl;
const SEASON_FOR_MATCHES = 2023;

export async function GET(
  request: Request,
  { params }: { params: { teamSlug: string } }
) {
  const { teamSlug } = params;

  if (!FOOTBALL_API_BASE_URL) {
    console.error('Football API base URL not configured');
    return NextResponse.json({ error: 'Football API configuration error' }, { status: 500 });
  }

  try {
    const mockTeam = footballTeams.find(t => t.slug === teamSlug);
    if (!mockTeam) {
      return NextResponse.json({ error: 'Football team not found in mock data' }, { status: 404 });
    }

    const teamId = mockTeam.id;

    // Fetch all data in parallel
    const [
      teamDetailsData,
      pastMatchesData,
      coachData,
      squadData,
      aiSummaryData
    ] = await Promise.allSettled([
      getFootballTeamDetails(teamId, FOOTBALL_API_BASE_URL),
      getFootballMatchesForTeam(teamId, SEASON_FOR_MATCHES, { status: 'FT' }, FOOTBALL_API_BASE_URL),
      getFootballCoachForTeam(teamId, FOOTBALL_API_BASE_URL),
      getFootballSquadForTeam(teamId, FOOTBALL_API_BASE_URL),
      getTeamInfo({ entityName: mockTeam.name, entityType: 'team' }) // Explicitly set entityType
    ]);

    const teamDetails = teamDetailsData.status === 'fulfilled' ? teamDetailsData.value : null;
    
    let pastMatches: MatchApp[] = [];
    if (pastMatchesData.status === 'fulfilled' && pastMatchesData.value) {
        pastMatches = pastMatchesData.value
          .sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime())
          .slice(0, 10); // Get top 10 most recent
    }
    
    const coach = coachData.status === 'fulfilled' ? coachData.value : null;
    const squad = squadData.status === 'fulfilled' ? squadData.value : [];
    const aiSummary = aiSummaryData.status === 'fulfilled' ? aiSummaryData.value.response : null;

    const responsePayload = {
      teamDetails,
      pastMatches,
      coach,
      squad,
      aiSummary,
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error(\`Error fetching details for football team \${teamSlug}:\`, error);
    return NextResponse.json({ error: \`Failed to fetch details for football team \${teamSlug}\` }, { status: 500 });
  }
}
