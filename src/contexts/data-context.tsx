
"use client";

import type { Batch, Task, SpeciesName } from '@/lib/types';
import { SPECIES_DATA } from '@/lib/constants';
import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';

interface DataContextType {
  batches: Batch[];
  addBatch: (batchData: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'>) => void;
  updateBatch: (batchData: Batch) => void;
  deleteBatch: (batchId: string) => void;
  getBatchById: (batchId: string) => Batch | undefined;
  getTasksForDate: (date: Date) => Task[];
  getAllTasks: () => Task[];
  updateTask: (updatedTask: Task) => void;
  addCandlingResult: (batchId: string, day: number, fertile: number, notes?: string) => void;
  setHatchedEggs: (batchId: string, count: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to generate tasks for a batch
const generateTasksForBatch = (batch: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'> & { id: string }): Task[] => {
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return [];

  const tasks: Task[] = [];
  const batchStartDate = startOfDay(parseISO(batch.startDate));

  for (let i = 1; i <= species.incubationDays; i++) {
    const currentDate = addDays(batchStartDate, i - 1);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    // Turning (daily until lockdown)
    if (i < species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-turn-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Turn eggs for ${batch.name}`,
        type: 'turn',
        completed: false,
      });
    }

    // Misting
    if (i >= species.mistingStartDay && i < species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-mist-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Mist eggs for ${batch.name}`,
        type: 'mist',
        completed: false,
      });
    }

    // Default Candling Days
    if (species.defaultCandlingDays.includes(i)) {
      tasks.push({
        id: `${batch.id}-candle-default-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Candle eggs for ${batch.name} (Day ${i})`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Custom Candling Days
    if (batch.customCandlingDays?.includes(i)) {
       tasks.push({
        id: `${batch.id}-candle-custom-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Custom candle eggs for ${batch.name} (Day ${i})`,
        type: 'candle',
        completed: false,
      });
    }


    // Lockdown Day
    if (i === species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-lockdown-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Lockdown for ${batch.name}. Stop turning/misting. Increase humidity.`,
        type: 'lockdown',
        completed: false,
      });
      // Add candling task on lockdown day
      tasks.push({
        id: `${batch.id}-candle-lockdown-${i}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: i,
        description: `Final candling for ${batch.name} before lockdown`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Hatch Check Days (e.g., from incubation day to incubation day + 2)
    if (i >= species.incubationDays && i <= species.incubationDays + 2) {
        tasks.push({
            id: `${batch.id}-hatch_check-${i}`,
            batchId: batch.id,
            batchName: batch.name,
            date: formattedDate,
            dayOfIncubation: i,
            description: `Check for hatching in ${batch.name}`,
            type: 'hatch_check',
            completed: false,
        });
    }
  }
  return tasks;
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<Batch[]>(() => {
    if (typeof window !== 'undefined') {
      const savedBatches = localStorage.getItem('hatchwise-batches');
      return savedBatches ? JSON.parse(savedBatches) : [];
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('hatchwise-batches', JSON.stringify(batches));
    }
  }, [batches]);

  const addBatch = useCallback((batchData: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'>) => {
    const newId = `batch-${Date.now()}`;
    const fullBatchData = { ...batchData, id: newId };
    const newTasks = generateTasksForBatch(fullBatchData);
    const newBatch: Batch = {
      ...fullBatchData,
      candlingResults: [],
      tasks: newTasks,
    };
    setBatches((prev) => [...prev, newBatch]);
  }, []);

  const updateBatch = useCallback((batchData: Batch) => {
    // Re-generate tasks if start date or species changed, or custom candling days
    // This is a simplified update; a real app might need more nuanced logic
    const existingBatch = batches.find(b => b.id === batchData.id);
    let tasksToUse = batchData.tasks;
    if (existingBatch && (existingBatch.startDate !== batchData.startDate || existingBatch.speciesId !== batchData.speciesId || JSON.stringify(existingBatch.customCandlingDays) !== JSON.stringify(batchData.customCandlingDays) )) {
        tasksToUse = generateTasksForBatch(batchData);
    }

    setBatches((prev) =>
      prev.map((b) => (b.id === batchData.id ? {...batchData, tasks: tasksToUse } : b))
    );
  }, [batches]);

  const deleteBatch = useCallback((batchId: string) => {
    setBatches((prev) => prev.filter((b) => b.id !== batchId));
  }, []);

  const getBatchById = useCallback((batchId: string) => {
    return batches.find((b) => b.id === batchId);
  }, [batches]);

  const getAllTasks = useCallback((): Task[] => {
    return batches.flatMap(batch => batch.tasks.map(task => ({...task, batchName: batch.name})));
  }, [batches]);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const formattedDate = format(startOfDay(date), 'yyyy-MM-dd');
    return getAllTasks().filter(task => task.date === formattedDate && !task.completed);
  }, [getAllTasks]);


  const updateTask = useCallback((updatedTask: Task) => {
    setBatches(prevBatches => 
      prevBatches.map(batch => {
        if (batch.id === updatedTask.batchId) {
          return {
            ...batch,
            tasks: batch.tasks.map(task => 
              task.id === updatedTask.id ? updatedTask : task
            )
          };
        }
        return batch;
      })
    );
  }, []);

  const addCandlingResult = useCallback((batchId: string, day: number, fertile: number, notes?: string) => {
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        const newResults = [...b.candlingResults, { day, fertile, notes }];
        // Sort by day just in case
        newResults.sort((a,b) => a.day - b.day);
        return { ...b, candlingResults: newResults };
      }
      return b;
    }));
  }, []);
  
  const setHatchedEggs = useCallback((batchId: string, count: number) => {
    setBatches(prev => prev.map(b => {
      if (b.id === batchId) {
        return { ...b, hatchedEggs: count };
      }
      return b;
    }));
  }, []);


  return (
    <DataContext.Provider value={{ batches, addBatch, updateBatch, deleteBatch, getBatchById, getTasksForDate, getAllTasks, updateTask, addCandlingResult, setHatchedEggs }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
