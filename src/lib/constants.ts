
import type { Species, SpeciesName } from './types';

// All day parameters (defaultCandlingDays, mistingStartDay, lockdownDay) are 1-INDEXED.
// Day 1 is the day AFTER eggs are set.
// incubationDays is the total duration, e.g., 21 means incubation from Day 1 to Day 21.
export const SPECIES_DATA: Record<SpeciesName, Species> = {
  chicken: {
    id: 'chicken',
    name: 'Chicken',
    incubationDays: 21, // Day 1 to Day 21
    defaultCandlingDays: [7, 14], // Represents Day 7, Day 14
    mistingStartDay: 999, // No standard misting
    lockdownDay: 19, // Lockdown starts on Day 19
  },
  pekin_duck: {
    id: 'pekin_duck',
    name: 'Pekin Duck',
    incubationDays: 28, // Day 1 to Day 28
    defaultCandlingDays: [7, 10, 25],
    mistingStartDay: 10, // Misting starts on Day 10
    lockdownDay: 25, // Lockdown starts on Day 25
  },
  muscovy_duck: {
    id: 'muscovy_duck',
    name: 'Muscovy Duck',
    incubationDays: 35, // Day 1 to Day 35
    defaultCandlingDays: [10, 20, 30],
    mistingStartDay: 10,
    lockdownDay: 32, // Lockdown starts on Day 32
  },
  turkey: {
    id: 'turkey',
    name: 'Turkey',
    incubationDays: 28,
    defaultCandlingDays: [10, 14, 25],
    mistingStartDay: 999,
    lockdownDay: 26,
  },
  goose_general: {
    id: 'goose_general',
    name: 'Goose (General)',
    incubationDays: 30, // average
    defaultCandlingDays: [7, 10, 17, 24],
    mistingStartDay: 8,
    lockdownDay: 27,
  },
  coturnix_quail: {
    id: 'coturnix_quail',
    name: 'Coturnix Quail',
    incubationDays: 17,
    defaultCandlingDays: [7, 14],
    mistingStartDay: 999,
    lockdownDay: 15,
  },
  bobwhite_quail: {
    id: 'bobwhite_quail',
    name: 'Bobwhite Quail',
    incubationDays: 23,
    defaultCandlingDays: [12, 15],
    mistingStartDay: 999,
    lockdownDay: 21,
  },
  custom: {
    id: 'custom',
    name: 'Custom (Define Params)',
    incubationDays: 1, // Minimal default
    defaultCandlingDays: [],
    mistingStartDay: 999,
    lockdownDay: 1, // Minimal default, user needs to understand 1-indexed convention
  },
};

export const ALL_SPECIES_LIST: Species[] = Object.values(SPECIES_DATA).sort((a, b) => {
  if (a.id === 'custom') return 1;
  if (b.id === 'custom') return -1;
  return a.name.localeCompare(b.name);
});

