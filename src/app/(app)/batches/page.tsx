
"use client";
import Link from 'next/link';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PlusCircle, Edit, Trash2, Eye, Layers, CalendarDays, Egg, Home } from 'lucide-react';
import { SPECIES_DATA } from '@/lib/constants';
import { format, parseISO, differenceInDays, startOfDay, addDays } from 'date-fns';
import SpeciesIcon from '@/components/shared/species-icon';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';

export default function BatchesPage() {
  const { batches, deleteBatch } = useData();
  const { toast } = useToast();
  const today = startOfDay(new Date());

  const handleDelete = (batchId: string, batchName: string) => {
    deleteBatch(batchId);
    toast({
      title: "Batch Deleted",
      description: `Batch "${batchName}" has been successfully deleted.`,
    });
  };
  
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-primary">Incubation Batches</h1>
        <Button asChild>
          <Link href="/batches/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Batch
          </Link>
        </Button>
      </div>

      {batches.length === 0 ? (
         <div className="text-center py-10 border-2 border-dashed border-border rounded-lg">
          <Layers className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-semibold mb-2">No Batches Yet</h2>
          <p className="text-muted-foreground mb-6">
            You haven't created any incubation batches. <br/>
            Click the button above to get started!
          </p>
          <Button asChild size="lg">
            <Link href="/batches/new">
              <PlusCircle className="mr-2 h-5 w-5" /> Create Your First Batch
            </Link>
          </Button>
        </div>
      ) : (
      <Card>
        <CardHeader>
          <CardTitle>All Batches</CardTitle>
          <CardDescription>Manage all your ongoing and past incubation batches. Day 1 is the day after eggs are set.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Species</TableHead>
                <TableHead className="hidden md:table-cell">Set Date</TableHead>
                <TableHead className="text-center">Eggs</TableHead>
                <TableHead className="hidden lg:table-cell text-center">Status (Day)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => {
                const species = SPECIES_DATA[batch.speciesId];
                const setDate = startOfDay(parseISO(batch.startDate));
                const daysElapsedSinceSet = differenceInDays(today, setDate); 
                
                let statusLabel: string;
                let statusVariant: "default" | "secondary" | "outline" = "secondary";

                if (daysElapsedSinceSet < 0) {
                    statusLabel = "Upcoming";
                    statusVariant = "outline";
                } else if (daysElapsedSinceSet === 0) {
                    statusLabel = "Set Day";
                } else if (daysElapsedSinceSet > species.incubationDays + 2) {
                    statusLabel = "Completed";
                    statusVariant = "default"; // More prominent for completed
                } else {
                    statusLabel = `Active (Day ${daysElapsedSinceSet})`;
                }


                return (
                  <TableRow key={batch.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <SpeciesIcon speciesId={batch.speciesId} className="h-5 w-5 text-muted-foreground hidden sm:block" />
                        {batch.name}
                      </div>
                    </TableCell>
                    <TableCell>{species?.name || 'Unknown'}</TableCell>
                    <TableCell className="hidden md:table-cell">{format(setDate, 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-center">{batch.numberOfEggs}</TableCell>
                    <TableCell className="hidden lg:table-cell text-center">
                       <Badge 
                          variant={statusVariant} 
                          className={cn(
                            statusLabel.startsWith("Active") && "bg-green-100 text-green-700",
                            statusLabel === "Completed" && "bg-blue-100 text-blue-700"
                          )}
                        >
                          {statusLabel}
                        </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild title="View Details">
                        <Link href={`/batches/${batch.id}`}><Eye className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Edit Batch">
                        <Link href={`/batches/${batch.id}/edit`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" title="Delete Batch" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the batch "{batch.name}" and all its associated data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDelete(batch.id, batch.name)} className="bg-destructive hover:bg-destructive/90">
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}
    </div>
  );
}
