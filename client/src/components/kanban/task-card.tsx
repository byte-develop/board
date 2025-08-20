import { motion } from "framer-motion";
import { Calendar, Clock, User, MessageCircle, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "@shared/schema";

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  isDragging?: boolean;
}

const priorityStyles = {
  high: "from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-l-red-500",
  medium: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-l-yellow-500",
  low: "from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-l-gray-400",
};

const priorityBadgeStyles = {
  high: "bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200",
  medium: "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200",
  low: "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200",
};

export function TaskCard({ task, onEdit, isDragging }: TaskCardProps) {
  const formatDueDate = (date: Date | null) => {
    if (!date) return "No due date";
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Due today";
    if (diffDays === 1) return "Due tomorrow";
    if (diffDays === -1) return "Due yesterday";
    if (diffDays > 0) return `Due in ${diffDays} days`;
    return `Overdue by ${Math.abs(diffDays)} days`;
  };

  const getDueDateColor = (date: Date | null) => {
    if (!date) return "text-gray-500 dark:text-gray-400";
    
    const dateObj = new Date(date);
    const now = new Date();
    const diffTime = dateObj.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) return "text-red-600 dark:text-red-400";
    if (diffDays <= 2) return "text-orange-600 dark:text-orange-400";
    return "text-gray-500 dark:text-gray-400";
  };

  // Use regular div during dragging to avoid conflicts
  if (isDragging) {
    return (
      <div
        className={cn(
          "bg-gradient-to-r border-l-4 rounded-lg p-4 cursor-grabbing shadow-xl opacity-95",
          priorityStyles[task.priority as keyof typeof priorityStyles]
        )}
        onClick={() => onEdit(task)}
      >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            priorityBadgeStyles[task.priority as keyof typeof priorityBadgeStyles]
          )}>
            {task.priority === "high" ? "High Priority" : 
             task.priority === "medium" ? "Medium" : "Low Priority"}
          </span>
          {task.tags && task.tags.length > 0 && (
            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full font-medium">
              {task.tags[0]}
            </span>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.progress > 0 && (
        <div className="mb-3">
          <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
              style={{ width: `${task.progress}%` }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{task.progress}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className={getDueDateColor(task.dueDate)}>
            {formatDueDate(task.dueDate)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {task.title.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
      </div>
    );
  }

  // Use motion.div when not dragging
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ 
        y: -4, 
        scale: 1.02,
        boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1), 0 0 20px rgba(59, 130, 246, 0.2)"
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 260, 
        damping: 20
      }}
      className={cn(
        "bg-gradient-to-r border-l-4 rounded-lg p-4 cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-200",
        priorityStyles[task.priority as keyof typeof priorityStyles]
      )}
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center space-x-2 flex-wrap">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full font-medium",
            priorityBadgeStyles[task.priority as keyof typeof priorityBadgeStyles]
          )}>
            {task.priority === "high" ? "High Priority" : 
             task.priority === "medium" ? "Medium" : "Low Priority"}
          </span>
          {task.tags && task.tags.length > 0 && (
            <span className="bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 text-xs px-2 py-1 rounded-full font-medium">
              {task.tags[0]}
            </span>
          )}
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 dark:text-white text-sm mb-2 line-clamp-2">
        {task.title}
      </h4>

      {task.description && (
        <p className="text-gray-600 dark:text-gray-400 text-xs mb-3 line-clamp-2">
          {task.description}
        </p>
      )}

      {task.progress > 0 && (
        <div className="mb-3">
          <div className="bg-gray-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
            <motion.div 
              className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${task.progress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span className="text-gray-500 dark:text-gray-400">Progress</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium">{task.progress}%</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <Calendar className="w-3 h-3 text-gray-400" />
          <span className={getDueDateColor(task.dueDate)}>
            {formatDueDate(task.dueDate)}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
            {task.title.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
