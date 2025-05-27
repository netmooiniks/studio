
"use client";

import type { Batch, Task, CandlingResult, IncubatorType } from '@/lib/types';
import { SPECIES_DATA } from '@/lib/constants';
import { addDays, differenceInDays, format, parseISO, startOfDay } from 'date-fns';
import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { useAuth } from './auth-context';
import { db } from '@/lib/firebase';
import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  writeBatch as firestoreWriteBatch, // Alias to avoid conflict with type Batch
  query, 
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

interface DataContextType {
  batches: Batch[];
  addBatch: (batchData: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'>) => Promise<void>;
  updateBatch: (batchData: Batch) => Promise<void>;
  deleteBatch: (batchId: string) => Promise<void>;
  getBatchById: (batchId: string) => Batch | undefined;
  getTasksForDate: (date: Date) => Task[];
  getAllTasks: () => Task[];
  updateTask: (updatedTask: Task) => Promise<void>;
  addCandlingResult: (batchId: string, day: number, fertile: number, notes?: string) => Promise<void>;
  setHatchedEggs: (batchId: string, count: number) => Promise<void>;
  loadingData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper to escape special characters for RegExp
const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
};

// Helper to generate tasks for a batch
const generateTasksForBatch = (batch: Pick<Batch, 'id' | 'name' | 'startDate' | 'speciesId' | 'incubatorType' | 'customCandlingDays'>): Task[] => {
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return [];

  const tasks: Task[] = [];
  const batchStartDate = startOfDay(parseISO(batch.startDate));
  const lastMistingDay = species.lockdownDay -1; // Misting stops the day before lockdown

  // Incubation days are 0-indexed, from Day 0 to Day (species.incubationDays - 1)
  for (let day = 0; day < species.incubationDays; day++) {
    const currentDate = addDays(batchStartDate, day); // Day 0 is batchStartDate
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    // Turning eggs (if manual) up to the day before lockdown
    if (batch.incubatorType === 'manual' && day < species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-turn-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Turn eggs for ${batch.name}`,
        type: 'turn',
        completed: false,
      });
    }

    // Misting eggs, from mistingStartDay up to and including lastMistingDay
    if (species.mistingStartDay <= day && day <= lastMistingDay) { // Ensure mistingStartDay is a valid start
      tasks.push({
        id: `${batch.id}-mist-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Mist eggs for ${batch.name}`,
        type: 'mist',
        completed: false,
      });
    }

    // Default candling days
    if (species.defaultCandlingDays.includes(day)) {
      tasks.push({
        id: `${batch.id}-candle-default-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Candle eggs for ${batch.name} (Day ${day})`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Custom candling days (assumed to be 0-indexed from form)
    if (batch.customCandlingDays?.includes(day)) {
       tasks.push({
        id: `${batch.id}-candle-custom-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Custom candle eggs for ${batch.name} (Day ${day})`,
        type: 'candle',
        completed: false,
      });
    }

    // Lockdown day tasks
    if (day === species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-lockdown-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Lockdown for ${batch.name}. Stop turning/misting. Increase humidity.`,
        type: 'lockdown',
        completed: false,
      });
      // Final candling on lockdown day
      tasks.push({
        id: `${batch.id}-candle-lockdown-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 0-indexed
        description: `Final candling for ${batch.name} before lockdown (Day ${day})`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Hatch check tasks: from expected hatch day (species.incubationDays - 1) for a few days
    // Hatching typically starts on the last day of incubation (Day N-1) and can extend.
    // Let's check from Day (N-1) up to Day (N-1 + 2).
    if (day >= (species.incubationDays - 1) && day < (species.incubationDays -1 + 3) ) {
        tasks.push({
            id: `${batch.id}-hatch_check-${day}`,
            batchId: batch.id,
            batchName: batch.name,
            date: formattedDate,
            dayOfIncubation: day, // 0-indexed
            description: `Check for hatching in ${batch.name} (Day ${day})`,
            type: 'hatch_check',
            completed: false,
        });
    }
  }
  return tasks;
};


export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const { currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!currentUser) {
      setBatches([]);
      setLoadingData(false);
      return;
    }

    setLoadingData(true);
    const batchesCol = collection(db, 'users', currentUser.uid, 'batches');
    const q = query(batchesCol, orderBy('startDate', 'desc')); // Order by start date

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBatches = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        // Ensure startDate is a string. Firestore Timestamps need conversion.
        startDate: doc.data().startDate instanceof Timestamp 
          ? doc.data().startDate.toDate().toISOString().split('T')[0] 
          : doc.data().startDate,
        candlingResults: doc.data().candlingResults || [],
        tasks: (doc.data().tasks || []).map((task: Task) => ({...task, batchName: doc.data().name})), // Ensure batchName is fresh
        incubatorType: doc.data().incubatorType || 'manual',
        customCandlingDays: doc.data().customCandlingDays || [],
      } as Batch));
      setBatches(userBatches);
      setLoadingData(false);
    }, (error) => {
      console.error("Error fetching batches:", error);
      toast({ title: "Error", description: "Could not fetch batches from database.", variant: "destructive"});
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [currentUser, toast]);

  const addBatch = useCallback(async (batchData: Omit<Batch, 'id' | 'candlingResults' | 'tasks' | 'hatchedEggs'>) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to add a batch.", variant: "destructive" });
      return;
    }
    try {
      const batchDocDataBase = {
        ...batchData, // name, speciesId, startDate, numberOfEggs, incubatorType, customCandlingDays, notes
        candlingResults: [],
        hatchedEggs: 0, // Initialize hatchedEggs to 0
      };
      // Tasks will be generated after we have an ID
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'batches'), batchDocDataBase);
      
      const newTasks = generateTasksForBatch({ 
        id: docRef.id, 
        name: batchData.name, 
        startDate: batchData.startDate, 
        speciesId: batchData.speciesId,
        incubatorType: batchData.incubatorType,
        customCandlingDays: batchData.customCandlingDays 
      });
      await updateDoc(docRef, { tasks: newTasks });

      toast({ title: "Batch Added", description: `Batch "${batchData.name}" created.` });
    } catch (error) {
      console.error("Error adding batch:", error);
      toast({ title: "Error Adding Batch", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast]);

  const updateBatch = useCallback(async (batchData: Batch) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to update a batch.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchData.id);
      const existingBatchFromState = batches.find(b => b.id === batchData.id);

      let tasksForUpdate = batchData.tasks || []; 

      const shouldRegenerateTasks = existingBatchFromState && (
          existingBatchFromState.startDate !== batchData.startDate ||
          existingBatchFromState.speciesId !== batchData.speciesId ||
          existingBatchFromState.incubatorType !== batchData.incubatorType ||
          JSON.stringify(existingBatchFromState.customCandlingDays || []) !== JSON.stringify(batchData.customCandlingDays || [])
      );

      if (shouldRegenerateTasks) {
          tasksForUpdate = generateTasksForBatch({
              id: batchData.id,
              name: batchData.name, 
              startDate: batchData.startDate,
              speciesId: batchData.speciesId,
              incubatorType: batchData.incubatorType,
              customCandlingDays: batchData.customCandlingDays,
          });
      } else if (existingBatchFromState && existingBatchFromState.name !== batchData.name) {
          const oldBatchName = existingBatchFromState.name;
          const newBatchName = batchData.name;
          
          const escapedOldBatchName = escapeRegExp(oldBatchName);
          const oldBatchNameRegex = new RegExp(escapedOldBatchName, 'g'); // 'g' for global replacement

          tasksForUpdate = (batchData.tasks || []).map(task => ({
              ...task,
              batchName: newBatchName, 
              description: task.description.replace(oldBatchNameRegex, newBatchName), 
          }));
      }
      
      const finalBatchDoc = {
        ...batchData, 
        tasks: tasksForUpdate, 
      };
      
      await setDoc(batchRef, finalBatchDoc); // Use setDoc to overwrite the entire document as intended
      toast({ title: "Batch Updated", description: `Batch "${batchData.name}" updated.` });
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({ title: "Error Updating Batch", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);

  const deleteBatch = useCallback(async (batchId: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in to delete a batch.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      await deleteDoc(batchRef);
      // Toast is handled in the component calling deleteBatch
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({ title: "Error Deleting Batch", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast]);

  const getBatchById = useCallback((batchId: string): Batch | undefined => {
    return batches.find((b) => b.id === batchId);
  }, [batches]);

  const getAllTasks = useCallback((): Task[] => {
    return batches.flatMap(batch => 
      (batch.tasks || []).map(task => {
        let currentDescription = task.description;
        // Ensure task.batchName is defined and different from current batch.name before attempting replacement
        if (task.batchName && task.batchName !== batch.name && currentDescription.includes(task.batchName)) {
             const oldNameRegex = new RegExp(escapeRegExp(task.batchName), 'g');
             currentDescription = currentDescription.replace(oldNameRegex, batch.name);
        }
        return {...task, batchName: batch.name, description: currentDescription };
      })
    );
  }, [batches]);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const formattedDate = format(startOfDay(date), 'yyyy-MM-dd');
    return getAllTasks().filter(task => task.date === formattedDate);
  }, [getAllTasks]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', updatedTask.batchId);
      const targetBatch = batches.find(b => b.id === updatedTask.batchId);
      if (!targetBatch) throw new Error("Batch not found for task update.");
      
      let taskDescription = updatedTask.description;
      // Ensure updatedTask.batchName is defined and different from targetBatch.name before attempting replacement
      if (updatedTask.batchName && updatedTask.batchName !== targetBatch.name && taskDescription.includes(updatedTask.batchName)) {
          const oldNameRegex = new RegExp(escapeRegExp(updatedTask.batchName), 'g');
          taskDescription = taskDescription.replace(oldNameRegex, targetBatch.name);
      }
      
      const taskWithCorrectBatchNameAndDesc = {...updatedTask, batchName: targetBatch.name, description: taskDescription };

      const newTasks = (targetBatch.tasks || []).map(task => 
        task.id === taskWithCorrectBatchNameAndDesc.id ? taskWithCorrectBatchNameAndDesc : task
      );
      await updateDoc(batchRef, { tasks: newTasks });
      // Toast is handled in the component calling updateTask
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error Updating Task", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);

  const addCandlingResult = useCallback(async (batchId: string, day: number, fertile: number, notes?: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      const targetBatch = batches.find(b => b.id === batchId);
      if (!targetBatch) throw new Error("Batch not found for candling result.");

      const newResult: CandlingResult = { day, fertile, notes: notes || '' }; // day is 0-indexed
      const newResults = [...(targetBatch.candlingResults || []), newResult].sort((a,b) => a.day - b.day);
      
      await updateDoc(batchRef, { candlingResults: newResults });
      // Toast is handled in the component
    } catch (error)
 {
      console.error("Error adding candling result:", error);
      toast({ title: "Error Adding Candling", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);
  
  const setHatchedEggs = useCallback(async (batchId: string, count: number) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      await updateDoc(batchRef, { hatchedEggs: count });
      // Toast is handled in the component
    } catch (error) {
      console.error("Error setting hatched eggs:", error);
      toast({ title: "Error Setting Hatched Eggs", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast]);


  return (
    <DataContext.Provider value={{ 
      batches, 
      addBatch, 
      updateBatch, 
      deleteBatch, 
      getBatchById, 
      getTasksForDate, 
      getAllTasks, 
      updateTask, 
      addCandlingResult, 
      setHatchedEggs,
      loadingData
    }}>
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


    