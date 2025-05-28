
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
  writeBatch as firestoreWriteBatch,
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
  deleteCandlingResult: (batchId: string, candlingResultId: string) => Promise<void>;
  setHatchedEggs: (batchId: string, count: number) => Promise<void>;
  loadingData: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to escape special characters for regex
function escapeRegExp(string: string) {
  if (typeof string !== 'string' || string.length === 0) {
    return ''; // Return empty string or handle as an error if appropriate
  }
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

const generateTasksForBatch = (batch: Pick<Batch, 'id' | 'name' | 'startDate' | 'speciesId' | 'incubatorType' | 'customCandlingDays'>): Task[] => {
  const species = SPECIES_DATA[batch.speciesId];
  if (!species) return [];

  const tasks: Task[] = [];
  const batchSetDate = startOfDay(parseISO(batch.startDate)); // This is the day eggs are actually set

  // Incubation runs from Day 1 to Day species.incubationDays.
  // Day 1 is the day AFTER eggs are set.
  for (let day = 1; day <= species.incubationDays; day++) { // `day` is 1-indexed incubation day
    const taskDateForThisIncubationDay = addDays(batchSetDate, day); // Date for tasks of this incubation day
    const formattedDate = format(taskDateForThisIncubationDay, 'yyyy-MM-dd');

    // Turning eggs (if manual) up to the day before lockdown
    if (batch.incubatorType === 'manual' && day < species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-turn-${day}`,
        batchId: batch.id,
        batchName: batch.name, 
        date: formattedDate,
        dayOfIncubation: day, // 1-indexed
        description: `Turn eggs`,
        type: 'turn',
        completed: false,
      });
    }

    // Misting eggs, from mistingStartDay up to the day before lockdown
    if (species.mistingStartDay <= day && day < species.lockdownDay) {
      tasks.push({
        id: `${batch.id}-mist-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 1-indexed
        description: `Mist eggs`,
        type: 'mist',
        completed: false,
      });
    }

    // Default candling days (1-indexed)
    if (species.defaultCandlingDays.includes(day)) {
      tasks.push({
        id: `${batch.id}-candle-default-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 1-indexed
        description: `Candle eggs (Day ${day})`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Custom candling days (expected to be 1-indexed from form)
    if (batch.customCandlingDays?.includes(day)) {
       tasks.push({
        id: `${batch.id}-candle-custom-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 1-indexed
        description: `Custom candle eggs (Day ${day})`,
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
        dayOfIncubation: day, // 1-indexed
        description: `Lockdown procedures`,
        type: 'lockdown',
        completed: false,
      });
      // Final candling on lockdown day
      tasks.push({
        id: `${batch.id}-candle-lockdown-${day}`,
        batchId: batch.id,
        batchName: batch.name,
        date: formattedDate,
        dayOfIncubation: day, // 1-indexed
        description: `Final candling before lockdown (Day ${day})`,
        type: 'candle',
        completed: false,
      });
    }
    
    // Hatch check tasks: from species.incubationDays (expected hatch day) for a few days.
    // e.g., if 21 days incubation, check on Day 21, 22, 23.
    if (day >= species.incubationDays && day <= species.incubationDays + 2 ) {
        tasks.push({
            id: `${batch.id}-hatch_check-${day}`,
            batchId: batch.id,
            batchName: batch.name,
            date: formattedDate,
            dayOfIncubation: day, // 1-indexed
            description: `Check for hatching (Day ${day})`,
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
    const q = query(batchesCol, orderBy('startDate', 'asc')); 

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const userBatches = snapshot.docs.map(docSnapshot => {
        const batchDataFromDoc = docSnapshot.data();
        
        return {
          id: docSnapshot.id,
          ...batchDataFromDoc,
          startDate: batchDataFromDoc.startDate instanceof Timestamp 
            ? batchDataFromDoc.startDate.toDate().toISOString().split('T')[0] 
            : batchDataFromDoc.startDate,
          candlingResults: (batchDataFromDoc.candlingResults || []).map((cr: CandlingResult) => ({
            ...cr, 
            id: cr.id || `candling-${cr.day}-${Math.random().toString(36).substring(2,9)}` // Ensure ID exists for older data
          })).sort((a: CandlingResult, b: CandlingResult) => a.day - b.day),
          tasks: (batchDataFromDoc.tasks || []).map((task: Task) => ({...task, batchName: batchDataFromDoc.name})), 
          incubatorType: batchDataFromDoc.incubatorType || 'manual',
          customCandlingDays: batchDataFromDoc.customCandlingDays || [], 
        } as Batch;
      });
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
        ...batchData, 
        candlingResults: [], 
        hatchedEggs: 0, 
        customCandlingDays: batchData.customCandlingDays || [], 
      };
      
      const docRef = await addDoc(collection(db, 'users', currentUser.uid, 'batches'), batchDocDataBase);
      
      const newTasks = generateTasksForBatch({ 
        id: docRef.id, 
        name: batchData.name, 
        startDate: batchData.startDate, 
        speciesId: batchData.speciesId,
        incubatorType: batchData.incubatorType,
        customCandlingDays: batchData.customCandlingDays 
      });
      await updateDoc(docRef, { tasks: newTasks }); // Tasks will have 1-indexed dayOfIncubation
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
      const newBatchName = batchData.name;

      const shouldRegenerateTasks = existingBatchFromState && (
          existingBatchFromState.startDate !== batchData.startDate ||
          existingBatchFromState.speciesId !== batchData.speciesId ||
          existingBatchFromState.incubatorType !== batchData.incubatorType ||
          JSON.stringify(existingBatchFromState.customCandlingDays || []) !== JSON.stringify(batchData.customCandlingDays || [])
      );

      if (shouldRegenerateTasks) {
          tasksForUpdate = generateTasksForBatch({
              id: batchData.id,
              name: newBatchName, 
              startDate: batchData.startDate,
              speciesId: batchData.speciesId,
              incubatorType: batchData.incubatorType,
              customCandlingDays: batchData.customCandlingDays, 
          });
      } else {
          tasksForUpdate = (existingBatchFromState?.tasks || []).map(t => ({
              ...t,
              batchName: newBatchName, // Only update batchName if not regenerating all tasks
              // Description will be generic and not include batch name
          }));
      }
      
      const finalBatchDoc = {
        ...batchData, 
        tasks: tasksForUpdate, 
        candlingResults: (batchData.candlingResults || []).map((cr: CandlingResult) => ({
            ...cr,
            id: cr.id || `candling-${cr.day}-${Math.random().toString(36).substring(2,9)}`
        })).sort((a: CandlingResult, b: CandlingResult) => a.day - b.day), 
        customCandlingDays: batchData.customCandlingDays || [], 
      };
      
      await setDoc(batchRef, finalBatchDoc);
    } catch (error) {
      console.error("Error updating batch:", error);
      toast({ title: "Error Updating Batch", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);

  const deleteBatch = useCallback(async (batchId: string) => {
    if (!currentUser) {
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      await deleteDoc(batchRef);
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
        (batch.tasks || []).map(task => ({...task, batchName: batch.name}))
    );
  }, [batches]);

  const getTasksForDate = useCallback((date: Date): Task[] => {
    const formattedDate = format(startOfDay(date), 'yyyy-MM-dd');
    return getAllTasks().filter(task => task.date === formattedDate);
  }, [getAllTasks]);

  const updateTask = useCallback(async (updatedTask: Task) => {
    if (!currentUser) {
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', updatedTask.batchId);
      const targetBatch = batches.find(b => b.id === updatedTask.batchId);
      if (!targetBatch) throw new Error("Batch not found for task update.");
      
      const taskWithCorrectedDetails = {
        ...updatedTask, 
        batchName: targetBatch.name,
      };

      const newTasks = (targetBatch.tasks || []).map(task => 
        task.id === taskWithCorrectedDetails.id ? taskWithCorrectedDetails : task
      );
      await updateDoc(batchRef, { tasks: newTasks });
    } catch (error) {
      console.error("Error updating task:", error);
      toast({ title: "Error Updating Task", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);

  const addCandlingResult = useCallback(async (batchId: string, day: number, fertile: number, notes?: string) => {
    if (!currentUser) {
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      const targetBatch = batches.find(b => b.id === batchId);
      if (!targetBatch) throw new Error("Batch not found for candling result.");

      const newResult: CandlingResult = { 
        id: `candling-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`, 
        day, 
        fertile, 
        notes: notes || '' 
      }; 
      const newResults = [...(targetBatch.candlingResults || []), newResult].sort((a: CandlingResult, b: CandlingResult) => a.day - b.day);
      
      await updateDoc(batchRef, { candlingResults: newResults });
    } catch (error) {
      console.error("Error adding candling result:", error);
      toast({ title: "Error Adding Candling", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);
  
  const deleteCandlingResult = useCallback(async (batchId: string, candlingResultId: string) => {
    if (!currentUser) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      const targetBatch = batches.find(b => b.id === batchId);
      if (!targetBatch) {
        toast({ title: "Error", description: "Batch not found.", variant: "destructive" });
        return;
      }

      const updatedCandlingResults = (targetBatch.candlingResults || []).filter(cr => cr.id !== candlingResultId);
      await updateDoc(batchRef, { candlingResults: updatedCandlingResults });
      toast({ title: "Candling Result Deleted", description: "The candling result has been removed." });
    } catch (error) {
      console.error("Error deleting candling result:", error);
      toast({ title: "Error Deleting Candling Result", description: String(error), variant: "destructive"});
    }
  }, [currentUser, toast, batches]);

  const setHatchedEggs = useCallback(async (batchId: string, count: number) => {
    if (!currentUser) {
      return;
    }
    try {
      const batchRef = doc(db, 'users', currentUser.uid, 'batches', batchId);
      await updateDoc(batchRef, { hatchedEggs: count });
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
      deleteCandlingResult, 
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


    