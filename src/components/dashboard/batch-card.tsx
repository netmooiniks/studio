
"use client";
import type { Batch } from '@/lib/types';
import { SPECIES_DATA } from '@/lib/constants';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { differenceInDays, parseISO, format, addDays, startOfDay } from 'date-fns';
import { CalendarDays, Egg, AlertTriangle, CheckCircle2 } from 'lucide-react';
import SpeciesIcon from '@/components/shared/species-icon';
import { useData } from '@/contexts/data-context';

interface BatchCardProps {
  batch: Batch;
}

export function BatchCard({ batch }: BatchCardProps) {
  const { getTasksForDate } = useData();
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return null;

  const startDate = parseISO(batch.startDate);
  const today = startOfDay(new Date());
  const currentDayOfIncubation = differenceInDays(today, startOfDay(startDate)) + 1;
  
  const progressPercentage = Math.min(Math.max(0, (currentDayOfIncubation / species.incubationDays) * 100), 100);

  const isCompleted = currentDayOfIncubation > species.incubationDays;
  const isHatchingWindow = currentDayOfIncubation >= species.lockdownDay && currentDayOfIncubation <= species.incubationDays + 2;

  const todaysTasks = getTasksForDate(new Date()).filter(task => task.batchId === batch.id);
  const hasPendingTasks = todaysTasks.some(task => !task.completed);

  let statusText = `Day ${currentDayOfIncubation} of ${species.incubationDays}`;
  if (isCompleted) {
    statusText = batch.hatchedEggs !== undefined ? `Hatched: ${batch.hatchedEggs}` : "Completed";
  } else if (isHatchingWindow) {
    statusText = "Hatching Window!";
  } else if (currentDayOfIncubation === species.lockdownDay) {
    statusText = "Lockdown Day!";
  }


  return (
    <Card className="flex flex-col h-full shadow-lg hover:shadow-xl transition-shadow duration-300">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-xl font-semibold text-primary">{batch.name}</CardTitle>
          <SpeciesIcon speciesId={batch.speciesId} className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-sm text-muted-foreground flex items-center">
          <Egg className="mr-2 h-4 w-4" /> {batch.numberOfEggs} eggs
        </p>
        <p className="text-sm text-muted-foreground flex items-center">
          <CalendarDays className="mr-2 h-4 w-4" /> Started: {format(startDate, 'MMM d, yyyy')}
        </p>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="mb-2">
          <div className="flex justify-between text-sm mb-1">
            <span className="font-medium">{statusText}</span>
            {!isCompleted && <span className="text-muted-foreground">{progressPercentage.toFixed(0)}%</span>}
          </div>
          {!isCompleted && <Progress value={progressPercentage} aria-label={`${statusText} progress`} className="h-3" />}
        </div>
        
        {hasPendingTasks && !isCompleted && (
          <p className="text-sm text-accent flex items-center mt-3">
            <AlertTriangle className="mr-1 h-4 w-4" /> {todaysTasks.filter(t => !t.completed).length} pending task(s) for today.
          </p>
        )}
        {!hasPendingTasks && !isCompleted && currentDayOfIncubation <= species.incubationDays && (
           <p className="text-sm text-green-600 flex items-center mt-3">
            <CheckCircle2 className="mr-1 h-4 w-4" /> All tasks for today complete!
          </p>
        )}
        {isCompleted && batch.hatchedEggs !== undefined && (
          <p className="text-sm text-green-600 font-semibold mt-3">
            Hatch successful: {batch.hatchedEggs} / {batch.numberOfEggs} chicks!
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
