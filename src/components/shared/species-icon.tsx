
import type { SpeciesName } from '@/lib/types';
import { Bird, Feather } from 'lucide-react'; // Using Bird as a general icon
import type { LucideProps } from 'lucide-react';

interface SpeciesIconProps extends LucideProps {
  speciesId: SpeciesName;
}

export default function SpeciesIcon({ speciesId, ...props }: SpeciesIconProps) {
  switch (speciesId) {
    case 'pekin_duck':
      return <Bird {...props} aria-label="Pekin Duck icon" />; // Or a more specific icon if available/custom
    case 'muscovy_duck':
      return <Feather {...props} aria-label="Muscovy Duck icon" />; // Different icon for variety
    default:
      return <Bird {...props} aria-label="Bird icon" />;
  }
}
