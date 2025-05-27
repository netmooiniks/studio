
export type SpeciesName = 
  'pekin_duck' | 
  'muscovy_duck' |
  'chicken' |
  'turkey' |
  'goose_general' |
  'coturnix_quail' |
  'bobwhite_quail' |
  'custom';

export interface Species {
  id: SpeciesName;
  name: string;
  incubationDays: number; // Total duration, e.g., 21 means Day 1 to Day 21.
  defaultCandlingDays: number[]; // 1-indexed days for candling tasks
  mistingStartDay: number; // 1-indexed day when misting starts (use a high value like 999 if no misting)
  lockdownDay: number; // 1-indexed day when lockdown procedures begin
}

export interface CandlingResult {
  id: string; // Unique ID for the candling result
  day: number; // Incubation day number (1-indexed)
  fertile: number;
  notes?: string;
}

export type IncubatorType = 'manual' | 'auto';

export interface Batch {
  id: string;
  name: string;
  speciesId: SpeciesName;
  startDate: string; // ISO date string
  numberOfEggs: number;
  incubatorType: IncubatorType;
  customCandlingDays?: number[]; // 1-indexed custom candling days
  candlingResults: CandlingResult[];
  tasks: Task[]; // Tasks specific to this batch
  hatchedEggs?: number;
  notes?: string;
}

export type TaskType = 'turn' | 'mist' | 'candle' | 'lockdown' | 'hatch_check' | 'custom';

export interface Task {
  id: string;
  batchId: string;
  batchName?: string; // For display purposes
  date: string; // ISO date string
  dayOfIncubation: number; // 1-indexed
  description: string;
  type: TaskType;
  completed: boolean;
  notes?: string;
}
