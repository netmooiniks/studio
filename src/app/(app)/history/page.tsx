
"use client";
import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Eye, Archive, Layers, CalendarDays, Egg, Percent } from 'lucide-react';
import { SPECIES_DATA } from '@/lib/constants';
import { format, parseISO, differenceInDays, startOfDay, addDays } from 'date-fns';
import SpeciesIcon from '@/components/shared/species-icon';
import { Badge } from '@/components/ui/badge';
import type { Batch } from '@/lib/types';

export default function HistoryPage() {
  const { batches } = useData();
  const today = startOfDay(new Date());

  const completedBatches = batches.filter(batch => {
    const species = SPECIES_DATA[batch.speciesId];
    if (!species) return false;
    const startDate = startOfDay(parseISO(batch.startDate));
    const dayOfIncubation = differenceInDays(today, startDate) + 1;
    // Consider completed a few days after expected hatch to allow for late hatchers
    return dayOfIncubation > species.incubationDays + 2; 
  }).map(batch => {
    const species = SPECIES_DATA[batch.speciesId];
    const startDate = startOfDay(parseISO(batch.startDate));
    const estimatedHatchDate = addDays(startDate, species.incubationDays -1);
    
    const lastCandlingResult = batch.candlingResults.length > 0 
      ? batch.candlingResults[batch.candlingResults.length - 1] 
      : null;
    
    const fertileEggs = lastCandlingResult ? lastCandlingResult.fertile : batch.numberOfEggs; // Fallback to total if no candling
    
    const fertilityRate = lastCandlingResult 
      ? (lastCandlingResult.fertile / batch.numberOfEggs) * 100 
      : null; // null if no candling data

    const hatchRateOfTotal = batch.hatchedEggs !== undefined && batch.numberOfEggs > 0
      ? (batch.hatchedEggs / batch.numberOfEggs) * 100
      : null;
    
    const hatchRateOfFertile = batch.hatchedEggs !== undefined && fertileEggs > 0
      ? (batch.hatchedEggs / fertileEggs) * 100
      : null;

    return {
      ...batch,
      speciesName: species.name,
      estimatedHatchDate: format(estimatedHatchDate, 'MMM d, yyyy'),
      fertileEggsCount: lastCandlingResult ? lastCandlingResult.fertile : (batch.hatchedEggs !== undefined ? batch.numberOfEggs : undefined), // if hatchedEggs is defined, assume all were fertile if no candling
      fertilityRate,
      hatchRateOfTotal,
      hatchRateOfFertile,
    };
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary flex items-center">
          <Archive className="mr-3 h-8 w-8" /> Batch History
        </h1>
      </div>

      {completedBatches.length === 0 ? (
         <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <Layers className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Completed Batches Yet</h2>
          <p className="text-muted-foreground mb-6">
            Once your incubation batches are complete, they will appear here with their statistics.
          </p>
        </div>
      ) : (
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Completed Batches</CardTitle>
          <CardDescription>Review statistics from your past incubation batches.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Species</TableHead>
                <TableHead className="hidden md:table-cell">Start Date</TableHead>
                <TableHead className="hidden lg:table-cell">Hatch Date (Est.)</TableHead>
                <TableHead className="text-center">Set</TableHead>
                <TableHead className="text-center hidden md:table-cell">Fertile</TableHead>
                <TableHead className="text-center">Hatched</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Fertility %</TableHead>
                <TableHead className="text-center hidden lg:table-cell">Hatch % (Fertile)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {completedBatches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <SpeciesIcon speciesId={batch.speciesId} className="h-5 w-5 text-muted-foreground hidden sm:block" />
                      {batch.name}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{batch.speciesName}</TableCell>
                  <TableCell className="hidden md:table-cell">{format(parseISO(batch.startDate), 'MMM d, yyyy')}</TableCell>
                  <TableCell className="hidden lg:table-cell">{batch.estimatedHatchDate}</TableCell>
                  <TableCell className="text-center">{batch.numberOfEggs}</TableCell>
                  <TableCell className="text-center hidden md:table-cell">
                    {batch.fertileEggsCount !== undefined ? batch.fertileEggsCount : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {batch.hatchedEggs !== undefined ? batch.hatchedEggs : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    {batch.fertilityRate !== null ? `${batch.fertilityRate.toFixed(1)}%` : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-center hidden lg:table-cell">
                    {batch.hatchRateOfFertile !== null ? `${batch.hatchRateOfFertile.toFixed(1)}%` : <span className="text-muted-foreground">-</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild title="View Details">
                      <Link href={`/batches/${batch.id}`}><Eye className="h-4 w-4" /></Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
