
"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CalendarIcon, Check, ChevronsUpDown } from "lucide-react";
import { format } from "date-fns";
import { ALL_SPECIES_LIST, SPECIES_DATA } from '@/lib/constants';
import type { Batch, SpeciesName, IncubatorType } from '@/lib/types';
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const incubatorTypes = ['manual', 'auto'] as const;

const batchFormSchema = z.object({
  name: z.string().min(2, { message: "Batch name must be at least 2 characters." }).max(50),
  speciesId: z.custom<SpeciesName>((val) => Object.keys(SPECIES_DATA).includes(val as string), {
    message: "Please select a valid species.",
  }),
  startDate: z.date({ required_error: "A start date is required." }),
  numberOfEggs: z.coerce.number().int().min(1, { message: "Must be at least 1 egg." }).max(1000),
  incubatorType: z.enum(incubatorTypes, { required_error: "Please select an incubator type."}).default('manual'),
  customCandlingDaysInput: z.string().optional(), // Temporary input for comma-separated days
  notes: z.string().max(500, {message: "Notes cannot exceed 500 characters."}).optional(),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

// Ensure the onSubmit prop expects incubatorType by using the Batch type directly where appropriate
interface BatchFormProps {
  onSubmit: (data: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'> & { customCandlingDays?: number[] }) => void;
  initialData?: Batch;
}

export function BatchForm({ onSubmit, initialData }: BatchFormProps) {
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customCandlingDays || []);
  
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: initialData 
      ? {
          ...initialData,
          startDate: new Date(initialData.startDate),
          incubatorType: initialData.incubatorType || 'manual',
          customCandlingDaysInput: initialData.customCandlingDays?.join(', ') || '',
        }
      : {
          name: "",
          startDate: new Date(),
          numberOfEggs: 10,
          incubatorType: 'manual',
          customCandlingDaysInput: '',
          notes: '',
        },
  });

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    form.setValue('customCandlingDaysInput', input);
    const parsedDays = input.split(',')
        .map(d => parseInt(d.trim(), 10))
        .filter(d => !isNaN(d) && d > 0 && d <= (SPECIES_DATA[form.getValues('speciesId')]?.incubationDays || 100)) // Max 100 as fallback
        .sort((a,b) => a - b);
    setCustomDays([...new Set(parsedDays)]); // Ensure unique days
  };


  function handleSubmit(data: BatchFormValues) {
    const { customCandlingDaysInput, ...restOfData } = data;
    onSubmit({ 
      ...restOfData, 
      startDate: format(data.startDate, "yyyy-MM-dd"),
      customCandlingDays: customDays 
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input placeholder="E.g., Spring Pekin Batch 1" {...field} />
              </FormControl>
              <FormDescription>A descriptive name for this incubation batch.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="speciesId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Species</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a species" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALL_SPECIES_LIST.map(species => (
                      <SelectItem key={species.id} value={species.id}>
                        {species.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  {field.value ? `Incubation: ${SPECIES_DATA[field.value]?.incubationDays} days. Default candling: Days ${SPECIES_DATA[field.value]?.defaultCandlingDays.join(', ')} & ${SPECIES_DATA[field.value]?.lockdownDay} (lockdown).` : 'Select the bird species for this batch.'}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
           <FormField
            control={form.control}
            name="incubatorType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Incubator Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select incubator type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="manual">Manual Turn</SelectItem>
                    <SelectItem value="auto">Auto Turn</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Select if your incubator has automatic egg turning. 'Auto Turn' will remove daily turning tasks.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date("1900-01-01") } // Allow past dates for record keeping
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>The day eggs are set in the incubator.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numberOfEggs"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Number of Eggs</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 24" {...field} />
                </FormControl>
                <FormDescription>Total eggs set for incubation.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="customCandlingDaysInput"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Custom Candling Days (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., 5, 12, 18 (comma-separated)" 
                  value={field.value || ''}
                  onChange={handleCustomDaysChange}
                />
              </FormControl>
              <FormDescription>
                Enter additional days for candling alerts, relative to start date (Day 1).
                These are in addition to default species candling days.
              </FormDescription>
              <div className="text-sm text-muted-foreground pt-1">
                Current custom days:{' '}
                {customDays.length > 0 ? (
                  customDays.map(d => <Badge key={d} variant="secondary" className="mr-1">{d}</Badge>)
                ) : (
                  <span className="italic">None</span>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Any specific notes for this batch..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
          {initialData ? 'Save Changes' : 'Create Batch'}
        </Button>
        {initialData && (
          <Button type="button" variant="outline" onClick={() => form.reset()} className="ml-2">
            Cancel
          </Button>
        )}
      </form>
    </Form>
  );
}
