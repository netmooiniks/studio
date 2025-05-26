
"use client";
import { BatchCard } from '@/components/dashboard/batch-card';
import { Button } from '@/components/ui/button';
import { useData } from '@/contexts/data-context';
import { PlusCircle, Layers } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, parseISO, startOfDay, addDays, format } from 'date-fns';
import { SPECIES_DATA } from '@/lib/constants';

export default function DashboardPage() {
  const { batches } = useData();
  const today = startOfDay(new Date());

  const activeBatches = batches.filter(batch => {
    const species = SPECIES_DATA[batch.speciesId];
    if (!species) return false;
    const startDate = startOfDay(parseISO(batch.startDate));
    const endDate = addDays(startDate, species.incubationDays + 2); // Include a couple of days for hatching
    return today >= startDate && today <= endDate;
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
        <Button asChild>
          <Link href="/batches/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Batch
          </Link>
        </Button>
      </div>

      {activeBatches.length === 0 ? (
        <div className="text-center py-10">
          <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Batches</h2>
          <p className="text-muted-foreground mb-4">Get started by adding your first incubation batch.</p>
          <Button asChild>
            <Link href="/batches/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create First Batch
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBatches.map((batch) => (
            <BatchCard key={batch.id} batch={batch} />
          ))}
        </div>
      )}
    </div>
  );
}
