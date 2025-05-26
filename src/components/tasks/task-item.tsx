
"use client";
import type { Task, TaskType } from '@/lib/types';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from '@/lib/utils';
import { Lightbulb, Droplets, RotateCcw, VenetianMask, Bird, Info } from 'lucide-react'; // VenetianMask for lockdown, Bird for hatch check
import SpeciesIcon from '@/components/shared/species-icon'; // if task is associated with a species

interface TaskItemProps {
  task: Task;
  onToggleComplete: (task: Task) => void;
  showBatchName?: boolean;
}

const TaskIcon = ({ type, className }: { type: TaskType, className?: string}) => {
  const props = { className: cn("h-4 w-4 mr-2", className) };
  switch (type) {
    case 'candle': return <Lightbulb {...props} />;
    case 'mist': return <Droplets {...props} />;
    case 'turn': return <RotateCcw {...props} />;
    case 'lockdown': return <VenetianMask {...props} />; // Using VenetianMask for lockdown
    case 'hatch_check': return <Bird {...props} />;
    case 'custom': return <Info {...props} />;
    default: return <Info {...props} />;
  }
};

export default function TaskItem({ task, onToggleComplete, showBatchName = false }: TaskItemProps) {
  return (
    <div 
      className={cn(
        "flex items-center justify-between p-4 rounded-lg border transition-colors",
        task.completed ? "bg-muted/50 border-green-200" : "bg-card hover:bg-muted/20",
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <Checkbox
          id={`task-${task.id}`}
          checked={task.completed}
          onCheckedChange={() => onToggleComplete(task)}
          aria-label={`Mark task ${task.description} as ${task.completed ? 'incomplete' : 'complete'}`}
        />
        <label 
            htmlFor={`task-${task.id}`} 
            className={cn(
                "flex-1 text-sm cursor-pointer", 
                task.completed && "line-through text-muted-foreground"
            )}
        >
            <div className="flex items-center">
                <TaskIcon type={task.type} />
                <span>{task.description}</span>
            </div>
           {showBatchName && task.batchName && (
             <Badge variant="outline" className="ml-2 text-xs font-normal mt-1 sm:mt-0 sm:ml-2 inline-block">{task.batchName}</Badge>
           )}
        </label>
      </div>
      <Badge variant={task.completed ? "default" : "secondary"} className={cn(task.completed && "bg-green-500 hover:bg-green-600 text-white")}>
        Day {task.dayOfIncubation}
      </Badge>
    </div>
  );
}
