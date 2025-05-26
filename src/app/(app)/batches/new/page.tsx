
"use client";
import { BatchForm } from '@/components/batches/batch-form';
import { useData } from '@/contexts/data-context';
import type { Batch } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function NewBatchPage() {
  const { addBatch } = useData();
  const router = useRouter();
  const { toast } = useToast();

  const handleSubmit = (data: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'>) => {
    addBatch(data);
    toast({
      title: "Batch Created!",
      description: `Successfully created batch "${data.name}".`,
    });
    router.push('/batches');
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">Create New Batch</CardTitle>
          <CardDescription>Enter the details for your new incubation batch.</CardDescription>
        </CardHeader>
        <CardContent>
          <BatchForm onSubmit={handleSubmit} />
        </CardContent>
      </Card>
    </div>
  );
}
