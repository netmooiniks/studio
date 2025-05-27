
import type { SpeciesName } from '@/lib/types';
import { Bird, Feather, Settings } from 'lucide-react'; // Using Bird as a general icon, Settings for custom
import type { LucideProps } from 'lucide-react';

interface SpeciesIconProps extends LucideProps {
  speciesId: SpeciesName;
}

export default function SpeciesIcon({ speciesId, ...props }: SpeciesIconProps) {
  switch (speciesId) {
    case 'chicken':
      return <Bird {...props} aria-label="Chicken icon" />;
    case 'pekin_duck':
      return <Bird {...props} aria-label="Pekin Duck icon" />;
    case 'muscovy_duck':
      return <Feather {...props} aria-label="Muscovy Duck icon" />;
    case 'turkey':
      return <Feather {...props} aria-label="Turkey icon" />; // Using Feather for larger birds
    case 'goose_general':
      return <Feather {...props} aria-label="Goose icon" />; // Using Feather
    case 'coturnix_quail':
      return <Bird {...props} aria-label="Coturnix Quail icon" />;
    case 'bobwhite_quail':
      return <Bird {...props} aria-label="Bobwhite Quail icon" />;
    case 'custom':
      return <Settings {...props} aria-label="Custom species icon" />;
    default:
      return <Bird {...props} aria-label="Bird icon" />;
  }
}
