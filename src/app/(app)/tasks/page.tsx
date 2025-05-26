
"use client";
import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, CheckCircle2 } from 'lucide-react';
import { format, startOfDay, addDays, subDays } from 'date-fns';
import TaskItem from '@/components/tasks/task-item';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function TasksPage() {
  const { getAllTasks, updateTask } = useData();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const { toast } = useToast();

  const tasksForSelectedDate = useMemo(() => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    return getAllTasks()
      .filter(task => task.date === formattedDate)
      .sort((a, b) => (a.batchName || '').localeCompare(b.batchName || '') || a.description.localeCompare(b.description));
  }, [selectedDate, getAllTasks]);
  
  const pendingTasksCount = useMemo(() => {
    return tasksForSelectedDate.filter(task => !task.completed).length;
  }, [tasksForSelectedDate]);

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(startOfDay(date));
    }
  };

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };
  
  const handleTaskToggle = (task: Task) => {
    updateTask({ ...task, completed: !task.completed });
    toast({
        title: `Task ${task.completed ? "Marked Incomplete" : "Completed"}`,
        description: `${task.batchName ? task.batchName + ': ' : ''}${task.description}`,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Daily Tasks</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousDay} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-[200px] justify-start text-left font-normal"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {format(selectedDate, "PPP")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          <Button variant="outline" size="icon" onClick={goToNextDay} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Tasks for {format(selectedDate, "MMMM d, yyyy")}</CardTitle>
          <CardDescription>
            {pendingTasksCount > 0 
              ? `${pendingTasksCount} task(s) pending for today.` 
              : `All tasks for today are complete!`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {tasksForSelectedDate.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-xl text-muted-foreground">No tasks scheduled for this day.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {tasksForSelectedDate.map(task => (
                <TaskItem key={task.id} task={task} onToggleComplete={handleTaskToggle} showBatchName={true}/>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
