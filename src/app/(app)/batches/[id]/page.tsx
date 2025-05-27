
"use client";
import { useParams, useRouter } from 'next/navigation';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Edit, Layers, CalendarDays, Egg, Thermometer, Lightbulb, BarChart3, ClipboardList, Zap, Hand } from 'lucide-react';
import Link from 'next/link';
import { SPECIES_DATA } from '@/lib/constants';
import { format, parseISO, differenceInDays, startOfDay, addDays } from 'date-fns';
import SpeciesIcon from '@/components/shared/species-icon';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TaskItem from '@/components/tasks/task-item';
import type { CandlingResult, Task } from '@/lib/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';


// Component for adding candling results
function AddCandlingResultForm({ batchId, onAddResult }: { batchId: string, onAddResult: (day: number, fertile: number, notes?: string) => void }) {
  const [day, setDay] = useState<number | undefined>();
  const [fertile, setFertile] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { getBatchById } = useData();
  const batch = getBatchById(batchId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (day !== undefined && fertile !== undefined && batch) {
      if (fertile > batch.numberOfEggs) {
        alert("Number of fertile eggs cannot exceed total eggs in batch.");
        return;
      }
      onAddResult(day, fertile, notes); // day is 1-indexed
      setDay(undefined);
      setFertile(undefined);
      setNotes('');
      setIsOpen(false);
    }
  };

  const maxIncubationDay = batch?.speciesId ? SPECIES_DATA[batch.speciesId].incubationDays : 50; // Max 1-indexed day

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Lightbulb className="mr-2 h-4 w-4" /> Add Candling Result</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Candling Result</DialogTitle>
          <DialogDescription>Record the results of your latest egg candling (Day 1 is the day after eggs are set).</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="candling-day">Incubation Day (1 = Day after set)</Label>
            <Input id="candling-day" type="number" value={day ?? ""} onChange={e => setDay(parseInt(e.target.value))} required min="1" max={maxIncubationDay} />
          </div>
          <div>
            <Label htmlFor="fertile-eggs">Number of Fertile Eggs</Label>
            <Input id="fertile-eggs" type="number" value={fertile ?? ""} onChange={e => setFertile(parseInt(e.target.value))} required min="0" max={batch?.numberOfEggs} />
          </div>
          <div>
            <Label htmlFor="candling-notes">Notes (Optional)</Label>
            <Textarea id="candling-notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="e.g., Strong veins, 2 clears..." />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button type="submit">Save Result</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Component for Hatch Rate
function HatchRateCalculator({ batchId }: { batchId: string }) {
  const { getBatchById, setHatchedEggs } = useData();
  const batch = getBatchById(batchId);
  const [hatchedInput, setHatchedInput] = useState<string>(batch?.hatchedEggs?.toString() ?? "");
  const { toast } = useToast();

  if (!batch) return null;

  const lastCandling = batch.candlingResults.length > 0 ? batch.candlingResults[batch.candlingResults.length - 1].fertile : batch.numberOfEggs;
  const hatched = batch.hatchedEggs ?? 0;

  const hatchRateOfTotal = batch.numberOfEggs > 0 ? (hatched / batch.numberOfEggs) * 100 : 0;
  const hatchRateOfFertile = lastCandling > 0 ? (hatched / lastCandling) * 100 : 0;

  const handleSetHatched = () => {
    const count = parseInt(hatchedInput);
    if (!isNaN(count) && count >= 0 && count <= batch.numberOfEggs) {
      setHatchedEggs(batchId, count);
      toast({ title: "Hatched Eggs Updated", description: `Set to ${count} for batch ${batch.name}.`});
    } else {
      toast({ title: "Invalid Input", description: "Please enter a valid number of hatched eggs.", variant: "destructive" });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hatch Rate Calculator</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-end gap-2">
          <div className="flex-grow">
            <Label htmlFor="hatched-eggs-input">Number of Hatched Eggs</Label>
            <Input id="hatched-eggs-input" type="number" value={hatchedInput} onChange={e => setHatchedInput(e.target.value)} placeholder={`0 - ${batch.numberOfEggs}`} min="0" max={batch.numberOfEggs} />
          </div>
          <Button onClick={handleSetHatched}>Set Hatched</Button>
        </div>
        <p>Total Eggs Set: <Badge variant="secondary">{batch.numberOfEggs}</Badge></p>
        <p>Fertile Eggs (at last candling): <Badge variant="secondary">{lastCandling}</Badge></p>
        <p>Hatched Eggs: <Badge>{hatched}</Badge></p>
        
        <div className="mt-4 pt-4 border-t">
          <h4 className="font-semibold mb-2">Calculated Hatch Rates:</h4>
          <p>Of Total Eggs Set: <span className="font-bold text-lg text-primary">{hatchRateOfTotal.toFixed(1)}%</span></p>
          <p>Of Fertile Eggs: <span className="font-bold text-lg text-primary">{hatchRateOfFertile.toFixed(1)}%</span></p>
        </div>
      </CardContent>
    </Card>
  );
}


export default function BatchDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { getBatchById, updateTask, addCandlingResult } = useData();
  const { toast } = useToast();
  const batchId = typeof params.id === 'string' ? params.id : '';
  const batch = getBatchById(batchId);

  const today = startOfDay(new Date());

  const sortedTasks = useMemo(() => {
    if (!batch) return [];
    return [...batch.tasks].sort((a, b) => {
      const dateDiff = parseISO(a.date).getTime() - parseISO(b.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      const dayDiff = a.dayOfIncubation - b.dayOfIncubation; // Sort by 1-indexed day
      if (dayDiff !== 0) return dayDiff;
      const typeOrder = { 'candle': 1, 'turn': 2, 'mist': 3, 'lockdown': 4, 'hatch_check': 5, 'custom': 6 };
      return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99) ;
    });
  }, [batch]);

  if (!batch) {
    return (
      <div className="container mx-auto py-8 text-center">
        <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold">Batch Not Found</h1>
        <p className="text-muted-foreground mb-4">The requested batch could not be found.</p>
        <Button onClick={() => router.push('/batches')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
        </Button>
      </div>
    );
  }

  const species = SPECIES_DATA[batch.speciesId];
  const setDate = startOfDay(parseISO(batch.startDate)); // Day eggs are set
  
  // Calculate 1-indexed current day of incubation
  const daysElapsedSinceSet = differenceInDays(today, setDate);
  let currentDayOfIncubation: number | null = null; // Represents 1-indexed day of incubation
  let displayDayText: string;

  if (daysElapsedSinceSet < 0) {
    displayDayText = "Upcoming";
  } else if (daysElapsedSinceSet === 0) {
    displayDayText = "Set Day";
  } else {
    currentDayOfIncubation = daysElapsedSinceSet;
    displayDayText = `Day ${currentDayOfIncubation}`;
  }
  
  const progressPercentage = currentDayOfIncubation !== null && currentDayOfIncubation > 0
    ? Math.min(Math.max(0, (currentDayOfIncubation / species.incubationDays) * 100), 100)
    : 0;
  
  // Estimated hatch date is Set Date + species.incubationDays
  const estimatedHatchDate = addDays(setDate, species.incubationDays); 

  const handleTaskToggle = (task: Task) => {
    updateTask({ ...task, completed: !task.completed });
    toast({
      title: `Task ${task.completed ? "Marked Incomplete" : "Completed"}`,
      description: task.description,
    });
  };
  
  const handleAddCandling = (day: number, fertile: number, notes?: string) => {
    if (!batch) return;
    addCandlingResult(batch.id, day, fertile, notes); // day is 1-indexed
    toast({ title: "Candling Result Added", description: `Day ${day}: ${fertile} fertile eggs recorded.`});
  };


  return (
    <div className="container mx-auto py-8">
      <Button variant="outline" onClick={() => router.push('/batches')} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Batches
      </Button>

      <Card className="mb-8 shadow-lg">
        <CardHeader className="flex flex-row justify-between items-start">
          <div>
            <CardTitle className="text-3xl font-bold text-primary flex items-center">
              <SpeciesIcon speciesId={batch.speciesId} className="mr-3 h-8 w-8" />
              {batch.name}
            </CardTitle>
            <CardDescription className="mt-1">{species.name} Incubation Batch</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/batches/${batch.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Batch
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" /> <strong>Set Date:</strong> {format(setDate, 'PPP')}</p>
            <p className="flex items-center"><Egg className="mr-2 h-5 w-5 text-muted-foreground" /> <strong>Eggs Set:</strong> {batch.numberOfEggs}</p>
            <p className="flex items-center"><Thermometer className="mr-2 h-5 w-5 text-muted-foreground" /> <strong>Incubation Period:</strong> {species.incubationDays} days (Day 1 to {species.incubationDays})</p>
            <p className="flex items-center"><CalendarDays className="mr-2 h-5 w-5 text-muted-foreground" /> <strong>Est. Hatch:</strong> {format(estimatedHatchDate, 'PPP')}</p>
             <p className="flex items-center">
              {batch.incubatorType === 'auto' 
                ? <Zap className="mr-2 h-5 w-5 text-muted-foreground" /> 
                : <Hand className="mr-2 h-5 w-5 text-muted-foreground" />}
              <strong>Incubator:</strong> {batch.incubatorType === 'auto' ? 'Auto Turn' : 'Manual Turn'}
            </p>
          </div>
          <div className="space-y-2 lg:col-span-2">
            <Label>Progress ({displayDayText} of {species.incubationDays} incubation days)</Label>
            <Progress value={progressPercentage} className="h-4" aria-label={`Incubation progress: ${displayDayText} of ${species.incubationDays} days`} />
            {batch.notes && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md">
                <p className="text-sm font-medium">Notes:</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{batch.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="tasks"><ClipboardList className="mr-2 h-4 w-4" />Tasks</TabsTrigger>
          <TabsTrigger value="fertility"><Lightbulb className="mr-2 h-4 w-4" />Fertility</TabsTrigger>
          <TabsTrigger value="hatch_rate"><BarChart3 className="mr-2 h-4 w-4" />Hatch Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <Card>
            <CardHeader>
              <CardTitle>Task Schedule</CardTitle>
              <CardDescription>All upcoming and completed tasks for this batch. Day 1 is the day after eggs are set.</CardDescription>
            </CardHeader>
            <CardContent>
              {sortedTasks.length > 0 ? (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {sortedTasks.map(task => (
                    <TaskItem key={task.id} task={task} onToggleComplete={handleTaskToggle} showBatchName={false}/>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No tasks generated for this batch yet. This might be due to an 'Auto Turn' incubator setting or species configuration.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fertility">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Fertility Tracking</CardTitle>
                <CardDescription>Log and view candling results over time (Day 1 is day after set).</CardDescription>
              </div>
              <AddCandlingResultForm batchId={batch.id} onAddResult={handleAddCandling} />
            </CardHeader>
            <CardContent>
              {batch.candlingResults.length === 0 ? (
                <p className="text-muted-foreground">No candling results recorded yet. Click "Add Candling Result" to start.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Incubation Day</TableHead>
                      <TableHead>Fertile Eggs</TableHead>
                      <TableHead>% Fertile</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batch.candlingResults.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell>Day {result.day}</TableCell> {/* Displaying the 1-indexed day */}
                        <TableCell>{result.fertile} / {batch.numberOfEggs}</TableCell>
                        <TableCell>{((result.fertile / batch.numberOfEggs) * 100).toFixed(1)}%</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{result.notes || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="hatch_rate">
          <HatchRateCalculator batchId={batch.id} />
        </TabsContent>
      </Tabs>

      <Button variant="outline" onClick={() => router.push('/batches')} className="mt-8">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to All Batches
      </Button>
    </div>
  );
}
