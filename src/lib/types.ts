
export type SpeciesName = 'pekin_duck' | 'muscovy_duck';

export interface Species {
  id: SpeciesName;
  name: string;
  incubationDays: number;
  defaultCandlingDays: number[]; // Relative to start day (day 1)
  mistingStartDay: number; // Relative to start day
  mistingEndDay: number; // Relative to start day (lockdown day)
  lockdownDay: number; // Relative to start day
}

export interface CandlingResult {
  day: number; // Incubation day number
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
  customCandlingDays?: number[];
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
  dayOfIncubation: number;
  description: string;
  type: TaskType;
  completed: boolean;
  notes?: string;
}

// This type was removed as it was not used and seemed like a placeholder.
// If HatchData is needed for something specific, it can be redefined.
// export interface HatchData {
//   totalEggs: number;
//   fertileEggsAtLockdown: number;
//   hatchedChicks: number;
// }
