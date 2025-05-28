
"use client";
import { BatchForm } from '@/components/batches/batch-form';
import { useData } from '@/contexts/data-context';
import type { Batch } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Layers } from 'lucide-react';

export default function EditBatchPage() {
  const { getBatchById, updateBatch } = useData();
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();

  const batchId = typeof params.id === 'string' ? params.id : '';
  const batchToEdit = getBatchById(batchId);

  // The BatchForm's onSubmit provides data where startDate is already a string.
  const handleSubmit = (data: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'> & { customCandlingDays?: number[] }) => {
    if (!batchToEdit) return;
    
    // Construct updatedBatchData:
    // - Start with batchToEdit for fields not in the form (id, candlingResults, tasks, hatchedEggs).
    // - Spread `data` to override with form values (name, speciesId, startDate (string), numberOfEggs, incubatorType, customCandlingDays, notes).
    // The startDate from `data` is already a string, correctly formatted by BatchForm.
    const updatedBatchData: Batch = {
      ...batchToEdit, // Carries over id, candlingResults, tasks, hatchedEggs
      ...data,        // Overrides with form data (name, speciesId, startDate (string), etc.)
    };

    updateBatch(updatedBatchData);
    toast({
      title: "Batch Updated!",
      description: `Successfully updated batch "${data.name}".`,
    });
    router.push(`/batches/${batchId}`);
  };

  const handleCancel = () => {
    router.back(); // Go back to the previous page (likely the batch detail page)
  };

  if (!batchToEdit) {
     return (
      <div className="container mx-auto py-8 text-center">
        <Layers className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-semibold">Batch Not Found</h1>
        <p className="text-muted-foreground mb-4">The batch you are trying to edit could not be found.</p>
        <Button onClick={() => router.push('/batches')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Batches
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-2xl">
       <Button variant="outline" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Edit Batch: {batchToEdit.name}</CardTitle>
          <CardDescription>Update the details for this incubation batch.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Pass the full batchToEdit as initialData; BatchForm will pick what it needs */}
          <BatchForm onSubmit={handleSubmit} initialData={batchToEdit} onCancel={handleCancel} />
        </CardContent>
      </Card>
    </div>
  );
}
