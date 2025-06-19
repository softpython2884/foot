
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
  console.log(`[API /api/sports/football/teams/${teamSlug}] GET request received.`);

  if (!FOOTBALL_API_BASE_URL) {
    console.error('[API /api/sports/football/teams] Football API base URL not configured');
    return NextResponse.json({ error: 'Football API configuration error' }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }

  try {
    const mockTeam = footballTeams.find(t => t.slug === teamSlug);
    if (!mockTeam) {
      console.warn(`[API /api/sports/football/teams/${teamSlug}] Team not found in mock data.`);
      return NextResponse.json({ error: 'Football team not found in mock data' }, { 
        status: 404,
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      });
    }
    console.log(`[API /api/sports/football/teams/${teamSlug}] Found mock team: ID ${mockTeam.id}, Name: ${mockTeam.name}`);

    const teamId = mockTeam.id;

    console.log(`[API /api/sports/football/teams/${teamSlug}] Fetching data from API-Sports...`);
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
      getTeamInfo({ entityName: mockTeam.name, entityType: 'team' })
    ]);

    console.log(`[API /api/sports/football/teams/${teamSlug}] API-Sports data fetch results:`);
    console.log(`  Team Details: ${teamDetailsData.status}`);
    console.log(`  Past Matches: ${pastMatchesData.status}`);
    console.log(`  Coach: ${coachData.status}`);
    console.log(`  Squad: ${squadData.status}`);
    console.log(`  AI Summary: ${aiSummaryData.status}`);


    const teamDetails = teamDetailsData.status === 'fulfilled' ? teamDetailsData.value : null;
    
    let pastMatches: MatchApp[] = [];
    if (pastMatchesData.status === 'fulfilled' && pastMatchesData.value) {
        pastMatches = pastMatchesData.value
          .sort((a, b) => new Date(b.matchTime).getTime() - new Date(a.matchTime).getTime())
          .slice(0, 10);
    } else if (pastMatchesData.status === 'rejected') {
        console.error(`[API /api/sports/football/teams/${teamSlug}] Error fetching past matches:`, pastMatchesData.reason);
    }
    
    const coach = coachData.status === 'fulfilled' ? coachData.value : null;
    if (coachData.status === 'rejected') console.error(`[API /api/sports/football/teams/${teamSlug}] Error fetching coach:`, coachData.reason);

    const squad = squadData.status === 'fulfilled' ? squadData.value : [];
    if (squadData.status === 'rejected') console.error(`[API /api/sports/football/teams/${teamSlug}] Error fetching squad:`, squadData.reason);

    const aiSummary = aiSummaryData.status === 'fulfilled' ? aiSummaryData.value.response : `AI summary for ${mockTeam.name} could not be generated.`;
    if (aiSummaryData.status === 'rejected') console.error(`[API /api/sports/football/teams/${teamSlug}] Error fetching AI summary:`, aiSummaryData.reason);


    const responsePayload = {
      teamDetails,
      pastMatches,
      coach,
      squad,
      aiSummary,
    };

    // console.log(`[API /api/sports/football/teams/${teamSlug}] Response payload:`, responsePayload);
    return NextResponse.json(responsePayload, {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });

  } catch (error) {
    console.error(`[API /api/sports/football/teams/${teamSlug}] Unexpected error:`, error);
    return NextResponse.json({ error: `Failed to fetch details for football team ${teamSlug}` }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  }
}
