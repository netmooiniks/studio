
"use client";
import { useState, useMemo } from 'react';
import { useData } from '@/contexts/data-context';
import { Button } from '@/components/ui/button';
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { CalendarIcon, ChevronLeft, ChevronRight, ClipboardList, CheckCircle2, Home } from 'lucide-react';
import { format, startOfDay, addDays, subDays, parseISO, isBefore } from 'date-fns';
import TaskItem from '@/components/tasks/task-item';
import type { Task } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function TasksPage() {
  const { getAllTasks, updateTask } = useData();
  const [selectedDate, setSelectedDate] = useState<Date>(startOfDay(new Date()));
  const [showOverdueTasks, setShowOverdueTasks] = useState(false);
  const { toast } = useToast();

  const tasksToDisplay = useMemo(() => {
    const allTasks = getAllTasks();
    const formattedSelectedDate = format(selectedDate, 'yyyy-MM-dd');
    const startOfSelectedDay = startOfDay(selectedDate);

    let filteredTasks;

    if (showOverdueTasks) {
      filteredTasks = allTasks.filter(task => {
        const taskDate = startOfDay(parseISO(task.date));
        const isSelectedDateTask = task.date === formattedSelectedDate;
        const isPastUncompletedTask = isBefore(taskDate, startOfSelectedDay) && !task.completed;
        return isSelectedDateTask || isPastUncompletedTask;
      });
    } else {
      filteredTasks = allTasks.filter(task => task.date === formattedSelectedDate);
    }

    return filteredTasks.sort((a, b) => {
      const dateA = parseISO(a.date).getTime();
      const dateB = parseISO(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB; // Sort by date first

      if (a.completed !== b.completed) return a.completed ? 1 : -1; // Incomplete tasks first

      return (a.batchName || '').localeCompare(b.batchName || '') || a.description.localeCompare(b.description);
    });
  }, [selectedDate, getAllTasks, showOverdueTasks]);
  
  const pendingTasksCount = useMemo(() => {
    return tasksToDisplay.filter(task => !task.completed).length;
  }, [tasksToDisplay]);

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

  const pageTitle = showOverdueTasks 
    ? `Overdue & Selected Day's Tasks` 
    : `Tasks for ${format(selectedDate, "MMMM d, yyyy")}`;
  
  const pageDescription = tasksToDisplay.length === 0 
    ? (showOverdueTasks ? "No overdue or selected day's tasks found." : "No tasks scheduled for this day.")
    : (pendingTasksCount > 0 
      ? `${pendingTasksCount} displayed task(s) are pending.` 
      : `All displayed tasks are complete!`);

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

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold text-primary">Daily Tasks</h1>
        <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
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
          <div className="flex items-center space-x-2 mt-2 sm:mt-0 sm:ml-4">
            <Switch
              id="show-overdue-tasks"
              checked={showOverdueTasks}
              onCheckedChange={setShowOverdueTasks}
              aria-label="Toggle showing overdue tasks"
            />
            <Label htmlFor="show-overdue-tasks">Show Overdue</Label>
          </div>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>{pageTitle}</CardTitle>
          <CardDescription>{pageDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {tasksToDisplay.length === 0 ? (
            <div className="text-center py-10">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500 mb-4" />
              <p className="text-xl text-muted-foreground">
                {showOverdueTasks ? "No overdue tasks and no tasks for the selected date." : "No tasks scheduled for this day."}
              </p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
              {tasksToDisplay.map(task => (
                <TaskItem key={task.id} task={task} onToggleComplete={handleTaskToggle} showBatchName={true}/>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
