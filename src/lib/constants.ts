
import type { Species, SpeciesName } from './types';

export const SPECIES_DATA: Record<SpeciesName, Species> = {
  pekin_duck: {
    id: 'pekin_duck',
    name: 'Pekin Duck',
    incubationDays: 28,
    defaultCandlingDays: [7, 14], // Day 25 is lockdown candling
    mistingStartDay: 10,
    mistingEndDay: 25, // Stop misting at lockdown
    lockdownDay: 25,
  },
  muscovy_duck: {
    id: 'muscovy_duck',
    name: 'Muscovy Duck',
    incubationDays: 35,
    defaultCandlingDays: [10, 20], // Day 32 is lockdown candling
    mistingStartDay: 10,
    mistingEndDay: 32, // Stop misting at lockdown
    lockdownDay: 32,
  },
};

export const ALL_SPECIES_LIST: Species[] = Object.values(SPECIES_DATA);
