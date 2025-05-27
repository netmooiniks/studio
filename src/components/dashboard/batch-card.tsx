
"use client";
import type { Batch } from '@/lib/types';
import { SPECIES_DATA } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { differenceInDays, parseISO, format, addDays, startOfDay } from 'date-fns';
import { CalendarDays, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SpeciesIcon from '@/components/shared/species-icon';
import { useData } from '@/contexts/data-context';
import Image from 'next/image';

interface BatchCardProps {
  batch: Batch;
}

export function BatchCard({ batch }: BatchCardProps) {
  const { getTasksForDate } = useData();
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return null;

  const setDate = startOfDay(parseISO(batch.startDate)); // Day eggs are set
  const today = startOfDay(new Date());
  
  const daysElapsedSinceSet = differenceInDays(today, setDate);
  let currentIncubationDay: number | null = null; // 1-indexed day of incubation
  
  if (daysElapsedSinceSet > 0) {
    currentIncubationDay = daysElapsedSinceSet;
  }

  const progressPercentage = currentIncubationDay !== null && currentIncubationDay > 0
    ? Math.min(Math.max(0, (currentIncubationDay / species.incubationDays) * 100), 100)
    : 0;

  // Completion: after (total incubation days + 2 days for hatching)
  // Day 1 is day after set. If incubation is 21 days, completed if current day > 21+2.
  const isCompleted = currentIncubationDay !== null && currentIncubationDay > species.incubationDays + 2;
  const speciesLockdownDay = species.lockdownDay; // 1-indexed

  // Hatching window: from lockdown day up to (total incubation days + 2 extra days for hatch)
  const isHatchingWindow = currentIncubationDay !== null && currentIncubationDay >= speciesLockdownDay && currentIncubationDay <= species.incubationDays + 2;
  
  let daysUntilLockdown: number | null = null;
  if (currentIncubationDay !== null && currentIncubationDay < speciesLockdownDay) {
    daysUntilLockdown = speciesLockdownDay - currentIncubationDay;
  }

  const todaysTasks = getTasksForDate(new Date()).filter(task => task.batchId === batch.id && !task.completed);
  const hasPendingTasks = todaysTasks.length > 0;

  let statusText: string;
  let progressBarLabel: string | null = null;

  if (isCompleted) {
    statusText = batch.hatchedEggs !== undefined ? `Hatched: ${batch.hatchedEggs}` : "Completed";
  } else if (isHatchingWindow) {
    statusText = "Hatching Window!";
    progressBarLabel = `Day ${currentIncubationDay} of ${species.incubationDays}`;
  } else if (currentIncubationDay !== null && currentIncubationDay === speciesLockdownDay) {
    statusText = "Lockdown Day!";
    progressBarLabel = `Day ${currentIncubationDay} of ${species.incubationDays}`;
  } else if (daysUntilLockdown === 1) {
    statusText = "Lockdown in 1 day";
    progressBarLabel = currentIncubationDay ? `Day ${currentIncubationDay} of ${species.incubationDays}` : null;
  } else if (daysUntilLockdown === 2) {
    statusText = "Lockdown in 2 days";
    progressBarLabel = currentIncubationDay ? `Day ${currentIncubationDay} of ${species.incubationDays}` : null;
  } else if (daysElapsedSinceSet < 0) { // Upcoming batch
    const daysToStart = Math.abs(daysElapsedSinceSet);
    statusText = `Starts in ${daysToStart} day${daysToStart === 1 ? '' : 's'}`;
  } else if (daysElapsedSinceSet === 0) { // Set Day
    statusText = "Set Day";
    progressBarLabel = "Incubation begins tomorrow"; // Clarified label for Set Day
  } else if (currentIncubationDay !== null) { // Default active state
    statusText = `Inc. Day: ${currentIncubationDay}`;
    progressBarLabel = `Day ${currentIncubationDay} of ${species.incubationDays}`;
  } else {
    statusText = "Status Unknown"; // Fallback
  }


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary">{batch.name}</CardTitle>
          <SpeciesIcon speciesId={batch.speciesId} className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground flex items-center">
           <Image src="/icon.png" alt="Eggs Icon" width={16} height={16} className="mr-2" /> {batch.numberOfEggs} eggs
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <CalendarDays className="mr-2 h-4 w-4" /> Set Date: {format(setDate, 'MMM d, yyyy')}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{statusText}</span>
            {progressBarLabel && <span className="text-muted-foreground">{progressBarLabel}</span>}
          </div>
          {!isCompleted && daysElapsedSinceSet >= 0 && <Progress value={progressPercentage} aria-label={`${progressBarLabel || 'Incubation progress'}`} className="h-3" />}
        </div>
        
        {hasPendingTasks && !isCompleted && daysElapsedSinceSet >=0 && currentIncubationDay !== null && currentIncubationDay <= species.incubationDays && (
          <p className="text-sm text-accent flex items-center mt-3">
            <AlertTriangle className="mr-1 h-4 w-4" /> {todaysTasks.length} pending task(s) for today.
          </p>
        )}
        {!hasPendingTasks && !isCompleted && daysElapsedSinceSet >=0 && currentIncubationDay !== null && currentIncubationDay <= species.incubationDays && (
           <p className="text-sm text-green-600 flex items-center mt-3">
            <CheckCircle2 className="mr-1 h-4 w-4" /> All tasks for today complete!
          </p>
        )}
        {isCompleted && batch.hatchedEggs !== undefined && (
          <p className="text-sm text-green-600 font-semibold mt-3">
            Hatch successful: {batch.hatchedEggs} / {batch.numberOfEggs} chicks!
          </p>
        )}
         {isCompleted && batch.hatchedEggs === undefined && (
          <p className="text-sm text-muted-foreground mt-3">
            Incubation period complete. Record hatched eggs.
          </p>
        )}

      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" className="w-full">
          <Link href={`/batches/${batch.id}`}>View Details</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
