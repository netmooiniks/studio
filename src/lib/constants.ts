
import type { Species, SpeciesName } from './types';

export const SPECIES_DATA: Record<SpeciesName, Species> = {
  chicken: {
    id: 'chicken',
    name: 'Chicken',
    incubationDays: 21, // days 0-20
    defaultCandlingDays: [6, 13], // Actual day 7, 14
    mistingStartDay: 999, // No standard misting
    lockdownDay: 18, // Actual day 19
  },
  pekin_duck: {
    id: 'pekin_duck',
    name: 'Pekin Duck',
    incubationDays: 28, // days 0-27
    defaultCandlingDays: [6, 9, 24], // Guide: 5-7, 10, 25. (0-indexed: 6, 9, 24)
    mistingStartDay: 9, // Actual day 10 (0-indexed: 9)
    lockdownDay: 24, // Actual day 25 (0-indexed: 24)
  },
  muscovy_duck: {
    id: 'muscovy_duck',
    name: 'Muscovy Duck',
    incubationDays: 35, // days 0-34
    defaultCandlingDays: [9, 19, 29], // Actual day 10, then ~weekly (Day 20, Day 30) -> 0-indexed: 9, 19, 29
    mistingStartDay: 9, // Actual day 10 (0-indexed: 9)
    lockdownDay: 31, // Actual day 32 (0-indexed: 31)
  },
  turkey: {
    id: 'turkey',
    name: 'Turkey',
    incubationDays: 28, // days 0-27
    defaultCandlingDays: [9, 13, 24], // Guide "7-10, 14, 25" -> actual Day 10, 14, 25 (0-indexed: 9, 13, 24)
    mistingStartDay: 999, // No standard misting
    lockdownDay: 25, // Actual day 26 (0-indexed: 25)
  },
  goose_general: {
    id: 'goose_general',
    name: 'Goose (General)',
    incubationDays: 30, // days 0-29 (average)
    defaultCandlingDays: [6, 9, 16, 23], // Actual day 7, 10, then ~weekly (0-indexed: 6, 9, 16, 23)
    mistingStartDay: 7, // Actual day 8 (0-indexed: 7)
    lockdownDay: 26, // Actual day 27 (0-indexed: 26)
  },
  coturnix_quail: {
    id: 'coturnix_quail',
    name: 'Coturnix Quail',
    incubationDays: 17, // days 0-16
    defaultCandlingDays: [6, 13], // Actual day 7, 14 (0-indexed: 6, 13)
    mistingStartDay: 999, // No standard misting
    lockdownDay: 14, // Actual day 15 (0-indexed: 14)
  },
  bobwhite_quail: {
    id: 'bobwhite_quail',
    name: 'Bobwhite Quail',
    incubationDays: 23, // days 0-22
    defaultCandlingDays: [11, 14], // Guide "12-15" -> actual Day 12, Day 15 (0-indexed: 11, 14)
    mistingStartDay: 999, // No standard misting
    lockdownDay: 20, // Actual day 21 (0-indexed: 20)
  },
  custom: {
    id: 'custom',
    name: 'Custom (Define Params)',
    incubationDays: 1, // Minimal default, user should adjust via custom features or notes
    defaultCandlingDays: [], // User must define these using "Custom Candling Days" input
    mistingStartDay: 999, // Default to no misting
    lockdownDay: 0, // Minimal default
  },
};

export const ALL_SPECIES_LIST: Species[] = Object.values(SPECIES_DATA).sort((a, b) => {
  if (a.id === 'custom') return 1; // Always sort 'custom' to the end
  if (b.id === 'custom') return -1;
  return a.name.localeCompare(b.name); // Sort other species alphabetically by name
});
