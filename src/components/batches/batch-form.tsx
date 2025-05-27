
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
import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/badge";

const incubatorTypes = ['manual', 'auto'] as const;

const batchFormSchema = z.object({
  name: z.string().min(2, { message: "Batch name must be at least 2 characters." }).max(50),
  speciesId: z.custom<SpeciesName>((val) => Object.keys(SPECIES_DATA).includes(val as string), {
    message: "Please select a valid species.",
  }),
  startDate: z.date({ required_error: "A start date (set date) is required." }),
  numberOfEggs: z.coerce.number().int().min(1, { message: "Must be at least 1 egg." }).max(1000),
  incubatorType: z.enum(incubatorTypes, { required_error: "Please select an incubator type."}).default('manual'),
  customCandlingDaysInput: z.string().optional(), // Temporary input for comma-separated days
  notes: z.string().max(500, {message: "Notes cannot exceed 500 characters."}).optional(),
});

type BatchFormValues = z.infer<typeof batchFormSchema>;

interface BatchFormProps {
  onSubmit: (data: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'> & { customCandlingDays?: number[] }) => void;
  initialData?: Batch;
}

export function BatchForm({ onSubmit, initialData }: BatchFormProps) {
  const [customDays, setCustomDays] = useState<number[]>(initialData?.customCandlingDays || []); // Should be 1-indexed
  
  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchFormSchema),
    defaultValues: initialData 
      ? {
          ...initialData,
          startDate: new Date(initialData.startDate), // This is the set date
          incubatorType: initialData.incubatorType || 'manual',
          customCandlingDaysInput: (initialData.customCandlingDays || []).join(', ') || '', // customCandlingDays are 1-indexed
        }
      : {
          name: "",
          // speciesId is implicitly undefined here, will be set if user selects one
          startDate: new Date(), // Set date
          numberOfEggs: 10,
          incubatorType: 'manual',
          customCandlingDaysInput: '',
          notes: '',
        },
  });

  const watchedSpeciesId = form.watch('speciesId');

  useEffect(() => {
    if (watchedSpeciesId) {
      const speciesInfo = SPECIES_DATA[watchedSpeciesId];
      if (speciesInfo) {
        const maxDay = speciesInfo.incubationDays; // Max 1-indexed day
        const currentInputString = form.getValues('customCandlingDaysInput') || "";
        
        const parsedAndFilteredDays = currentInputString.split(',')
          .map(d => parseInt(d.trim(), 10))
          .filter(d => !isNaN(d) && d >= 1 && d <= maxDay) // Filter against new species maxDay (1-indexed)
          .sort((a, b) => a - b);
        
        const uniqueDays = [...new Set(parsedAndFilteredDays)];
        setCustomDays(uniqueDays);
        
        const newFilteredInputString = uniqueDays.join(', ');
        if (currentInputString !== newFilteredInputString) {
          form.setValue('customCandlingDaysInput', newFilteredInputString, { shouldValidate: true, shouldDirty: true });
        }
      }
    } else { // If speciesId is cleared, clear custom days input and badges
        setCustomDays([]);
        form.setValue('customCandlingDaysInput', '', { shouldValidate: false });
    }
  }, [watchedSpeciesId, form, setCustomDays]);


  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    form.setValue('customCandlingDaysInput', input); 
    
    const currentSpeciesId = form.getValues('speciesId');
    if (!currentSpeciesId) {
        const parsedDays = input.split(',')
            .map(d => parseInt(d.trim(), 10))
            .filter(d => !isNaN(d) && d >= 1) // Basic validation: positive
            .sort((a,b) => a - b);
        setCustomDays([...new Set(parsedDays)]);
        return;
    }

    const speciesInfo = SPECIES_DATA[currentSpeciesId];
    const maxDay = speciesInfo ? speciesInfo.incubationDays : 99; // Max 1-indexed day

    const parsedDays = input.split(',')
        .map(d => parseInt(d.trim(), 10))
        .filter(d => !isNaN(d) && d >= 1 && d <= maxDay) // 1-indexed validation
        .sort((a,b) => a - b);
    setCustomDays([...new Set(parsedDays)]); // Ensure unique days, stored 1-indexed
  };


  function handleSubmit(data: BatchFormValues) {
    const { customCandlingDaysInput, ...restOfData } = data;
    onSubmit({ 
      ...restOfData, 
      startDate: format(data.startDate, "yyyy-MM-dd"), // This is the set date
      customCandlingDays: customDays // customDays is 1-indexed and validated
    });
  }
  
  const currentSpecies = form.watch('speciesId') ? SPECIES_DATA[form.watch('speciesId')] : null;
  const speciesInfoText = currentSpecies 
    ? `Incubation: ${currentSpecies.incubationDays} days (Day 1 to ${currentSpecies.incubationDays}). Day 1 is day after set. Default candling: Days ${currentSpecies.defaultCandlingDays.join(', ')} & ${currentSpecies.lockdownDay} (lockdown).`
    : 'Select the bird species for this batch.';

  const handleCancel = () => {
    if (initialData) {
      // Reset logic for editing
      form.reset({
        ...initialData,
        startDate: new Date(initialData.startDate),
        incubatorType: initialData.incubatorType || 'manual',
        customCandlingDaysInput: (initialData.customCandlingDays || []).join(', ') || '',
      });
      setCustomDays(initialData.customCandlingDays || []);
    } else {
      // Reset logic for creating (to default new batch values)
      form.reset({
        name: "",
        speciesId: undefined, // This will clear the Select component
        startDate: new Date(),
        numberOfEggs: 10,
        incubatorType: 'manual',
        customCandlingDaysInput: '',
        notes: '',
      });
      setCustomDays([]); // Also clear custom days badges
    }
  };

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
                <Select 
                    onValueChange={(value) => {
                        field.onChange(value as SpeciesName);
                    }} 
                    defaultValue={field.value}
                    value={field.value} // Ensure the Select is controlled
                >
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
                  {speciesInfoText}
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
                <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
                <FormLabel>Set Date (Day Eggs Are Placed in Incubator)</FormLabel>
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
                      disabled={(date) => date < new Date("1900-01-01") } 
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>This is the date eggs are set. Incubation Day 1 is the day *after* this date.</FormDescription>
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
              <FormLabel>Custom Candling Days (Optional, 1-indexed)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="e.g., 4, 11, 17 (Day 1 is day after set)" 
                  value={field.value || ''}
                  onChange={(e) => {
                      field.onChange(e); // This updates react-hook-form's internal state for this field
                      handleCustomDaysChange(e); // This updates the 'customDays' state for badge display & validation
                  }}
                  disabled={!form.getValues('speciesId')}
                />
              </FormControl>
              <FormDescription>
                Enter 1-indexed days for candling alerts (e.g., Day 1 is the day after eggs are set).
                These are in addition to default species candling days. Max day is {currentSpecies ? currentSpecies.incubationDays : 'N/A'}.
              </FormDescription>
               <div className="text-sm text-muted-foreground pt-1">
                Current custom days (1-indexed):{' '}
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

        <div className="flex items-center">
          <Button type="submit" className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground">
            {initialData ? 'Save Changes' : 'Create Batch'}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel} className="ml-2">
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
