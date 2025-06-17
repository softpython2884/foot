'use client';

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { League, Team } from "@/lib/types";
import { CalendarIcon, Filter } from "lucide-react";
import { format } from "date-fns";

interface FiltersProps {
  leagues: League[];
  teams: Team[];
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedLeague: string;
  onLeagueChange: (leagueId: string) => void;
  selectedTeam: string;
  onTeamChange: (teamId: string) => void;
  onClearFilters: () => void;
}

const ALL_ITEMS_FILTER_VALUE = "%%ALL_ITEMS_FILTER_VALUE%%"; // Unique non-empty string

export function Filters({
  leagues,
  teams,
  selectedDate,
  onDateChange,
  selectedLeague,
  onLeagueChange,
  selectedTeam,
  onTeamChange,
  onClearFilters
}: FiltersProps) {
  return (
    <div className="bg-card p-6 rounded-lg shadow-md mb-8">
      <h2 className="text-2xl font-semibold font-headline mb-6 flex items-center gap-2">
        <Filter size={24} className="text-primary" />
        Filter Matches
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div>
          <Label htmlFor="date-picker" className="block mb-2 font-medium">Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="date-picker"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={onDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="league-select" className="block mb-2 font-medium">League</Label>
          <Select 
            value={selectedLeague === '' ? ALL_ITEMS_FILTER_VALUE : selectedLeague} 
            onValueChange={(value) => {
              onLeagueChange(value === ALL_ITEMS_FILTER_VALUE ? '' : value);
            }}
          >
            <SelectTrigger id="league-select" className="w-full">
              <SelectValue placeholder="Select League" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_FILTER_VALUE}>All Leagues</SelectItem>
              {leagues.map((league) => (
                <SelectItem key={league.id} value={league.id}>
                  {league.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="team-select" className="block mb-2 font-medium">Team</Label>
          <Select 
            value={selectedTeam === '' ? ALL_ITEMS_FILTER_VALUE : selectedTeam} 
            onValueChange={(value) => {
              onTeamChange(value === ALL_ITEMS_FILTER_VALUE ? '' : value);
            }}
          >
            <SelectTrigger id="team-select" className="w-full">
              <SelectValue placeholder="Select Team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL_ITEMS_FILTER_VALUE}>All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-end">
          <Button onClick={onClearFilters} variant="outline" className="w-full">
            Clear Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
