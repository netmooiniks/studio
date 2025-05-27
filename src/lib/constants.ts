
import type { Species, SpeciesName } from './types';

export const SPECIES_DATA: Record<SpeciesName, Species> = {
  pekin_duck: {
    id: 'pekin_duck',
    name: 'Pekin Duck',
    incubationDays: 28, // Total duration. Days are 0-indexed from 0 to 27.
    defaultCandlingDays: [6, 13], // 0-indexed (previously 7, 14)
    mistingStartDay: 9, // 0-indexed (previously 10)
    // Misting occurs from mistingStartDay up to, but not including, lockdownDay
    lockdownDay: 24, // 0-indexed (previously 25)
  },
  muscovy_duck: {
    id: 'muscovy_duck',
    name: 'Muscovy Duck',
    incubationDays: 35, // Total duration. Days are 0-indexed from 0 to 34.
    defaultCandlingDays: [9, 19], // 0-indexed (previously 10, 20)
    mistingStartDay: 9, // 0-indexed (previously 10)
    lockdownDay: 31, // 0-indexed (previously 32)
  },
};

export const ALL_SPECIES_LIST: Species[] = Object.values(SPECIES_DATA);
