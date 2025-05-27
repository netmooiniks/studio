
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

// Helper to generate tasks for a batch
const generateTasksForBatch = (batch: Pick<Batch, 'id' | 'name' | 'startDate' | 'speciesId' | 'incubatorType' | 'customCandlingDays'>): Task[] => {
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return [];

  const tasks: Task[] = [];
  const batchStartDate = startOfDay(parseISO(batch.startDate));

  for (let i = 1; i <= species.incubationDays; i++) {
    const currentDate = addDays(batchStartDate, i - 1);
    const formattedDate = format(currentDate, 'yyyy-MM-dd');

    if (batch.incubatorType === 'manual' && i < species.lockdownDay) {
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
        tasks: doc.data().tasks || [],
        incubatorType: doc.data().incubatorType || 'manual',
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
      // Firestore will generate the ID, but tasks need an ID for their own generation.
      // We'll add a temporary ID, then let Firestore assign the final one to the batch.
      // The tasks themselves will have IDs derived from this temporary one initially,
      // but this isn't ideal. A better approach is to add the batch, get its ID, then add tasks.
      // For simplicity now, we'll generate tasks with a placeholder batch ID part if needed.
      // OR, we can add the batch, then update it with tasks.
      
      // Create the batch document without tasks first
      const batchDocData = {
        ...batchData,
        incubatorType: batchData.incubatorType || 'manual',
        candlingResults: [],
        hatchedEggs: 0, // Default to 0
         // Convert date string to Firestore Timestamp for proper querying if needed, or store as ISO string
        startDate: batchData.startDate // Assuming it's already yyyy-MM-dd
      };

      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'batches'), batchDocData);
      
      // Now generate tasks with the real batch ID
      const newTasks = generateTasksForBatch({ ...batchData, id: docRef.id });
      await updateDoc(docRef, { tasks: newTasks });

      // No need to call setBatches here, onSnapshot will update the state
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
      const existingBatch = batches.find(b => b.id === batchData.id);
      let tasksToUse = batchData.tasks;

      if (existingBatch && (
          existingBatch.startDate !== batchData.startDate || 
          existingBatch.speciesId !== batchData.speciesId || 
          existingBatch.incubatorType !== batchData.incubatorType || 
          JSON.stringify(existingBatch.customCandlingDays) !== JSON.stringify(batchData.customCandlingDays)
        )) {
          const batchDataForTaskGen = { ...batchData, incubatorType: batchData.incubatorType || 'manual' };
          tasksToUse = generateTasksForBatch(batchDataForTaskGen);
      }
      
      await setDoc(batchRef, { ...batchData, tasks: tasksToUse, incubatorType: batchData.incubatorType || 'manual' });
      // onSnapshot will handle state update
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
      // onSnapshot will handle state update
      // toast({ title: "Batch Deleted", description: "Batch removed successfully."}); // Toast handled by component
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast({ title: "Error Deleting Batch", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast]);

  const getBatchById = useCallback((batchId: string): Batch | undefined => {
    // Data is now primarily driven by onSnapshot, so local state should be up-to-date
    return batches.find((b) => b.id === batchId);
  }, [batches]);

  const getAllTasks = useCallback((): Task[] => {
    return batches.flatMap(batch => (batch.tasks || []).map(task => ({...task, batchName: batch.name})));
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

      const newTasks = (targetBatch.tasks || []).map(task => 
        task.id === updatedTask.id ? updatedTask : task
      );
      await updateDoc(batchRef, { tasks: newTasks });
      // onSnapshot handles state update
      // Toast handled by component
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

      const newResult: CandlingResult = { day, fertile, notes: notes || '' };
      const newResults = [...(targetBatch.candlingResults || []), newResult].sort((a,b) => a.day - b.day);
      
      await updateDoc(batchRef, { candlingResults: newResults });
      // onSnapshot handles state update
      // Toast handled by component
    } catch (error) {
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
      // onSnapshot handles state update
      // Toast handled by component
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

