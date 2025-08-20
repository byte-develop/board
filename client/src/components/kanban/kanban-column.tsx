import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { createPortal } from "react-dom";
import { TaskCard } from "./task-card";
import { Button } from "@/components/ui/button";
import type { Column, Task } from "@shared/schema";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onAddTask: (columnId: string) => void;
  onEditTask: (task: Task) => void;
  index: number;
}

const columnColors = {
  "#3b82f6": "bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200",
  "#eab308": "bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200",
  "#f97316": "bg-orange-100 dark:bg-orange-900/50 text-orange-800 dark:text-orange-200",
  "#10b981": "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-200",
};

export function KanbanColumn({ column, tasks, onAddTask, onEditTask, index }: KanbanColumnProps) {
  const completedTasks = tasks.filter(task => task.status === "done").length;
  const progress = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, type: "spring", stiffness: 200, damping: 20 }}
      className="w-80 bg-gradient-to-b from-white/80 to-white/60 dark:from-slate-800/80 dark:to-slate-800/60 backdrop-blur-md rounded-2xl border border-gray-200/40 dark:border-slate-700/40 shadow-xl shadow-black/5 dark:shadow-black/20 hover:shadow-2xl transition-all duration-300"
    >
      <div className="p-5 border-b border-gray-200/30 dark:border-slate-700/30 bg-gradient-to-r from-transparent via-white/20 to-transparent dark:via-slate-700/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div 
                    className="w-4 h-4 rounded-full shadow-lg"
                    style={{ backgroundColor: column.color, boxShadow: `0 0 20px ${column.color}40` }}
                  />
                  <div 
                    className="absolute inset-0 w-4 h-4 rounded-full animate-pulse"
                    style={{ backgroundColor: column.color, opacity: 0.3 }}
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">{column.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    {tasks.length} task{tasks.length !== 1 ? 's' : ''} • {Math.round(progress)}% complete
                  </p>
                </div>
                <span className={`text-xs px-3 py-1.5 rounded-xl font-bold shadow-sm border ${
                  columnColors[column.color as keyof typeof columnColors] || 
                  "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                } border-white/50 dark:border-slate-600/50`}>
                  {tasks.length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask(column.id)}
                  className="h-9 w-9 p-0 rounded-xl hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200 group"
                  style={{ 
                    color: column.color,
                    ['--tw-ring-color' as any]: `${column.color}40`
                  }}
                >
                  <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 w-9 p-0 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white/80 dark:hover:bg-slate-700/80 transition-all duration-200"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Enhanced Progress Bar */}
            <div className="mt-4 bg-gray-200/60 dark:bg-slate-700/60 rounded-full h-2 overflow-hidden backdrop-blur-sm">
              <motion.div 
                className="h-full rounded-full shadow-sm"
                style={{ 
                  background: `linear-gradient(90deg, ${column.color}CC, ${column.color})`
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            </div>
          </div>

          <Droppable droppableId={column.id} type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-5 min-h-96 transition-all duration-300 rounded-b-2xl ${
                  snapshot.isDraggingOver 
                    ? "bg-gradient-to-b from-blue-50/60 to-blue-100/40 dark:from-blue-900/20 dark:to-blue-800/10 shadow-inner" 
                    : "hover:bg-gray-50/30 dark:hover:bg-slate-700/20"
                }`}
                style={{
                  // Убираем любые transform стили, которые могут мешать
                  position: 'relative'
                }}
              >
                {tasks.map((task, taskIndex) => (
                  <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                    {(provided, snapshot) => {
                      const child = (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          style={{
                            ...provided.draggableProps.style,
                            marginBottom: '12px',
                          }}
                        >
                          <TaskCard
                            task={task}
                            onEdit={onEditTask}
                            isDragging={snapshot.isDragging}
                          />
                        </div>
                      );

                      // Если элемент перетаскивается, рендерим его через Portal
                      if (snapshot.isDragging) {
                        return createPortal(child, document.body);
                      }

                      return child;
                    }}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Drop Zone Indicator */}
                {snapshot.isDraggingOver && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className="h-24 border-2 border-dashed border-blue-300 dark:border-blue-600 rounded-lg bg-blue-50/50 dark:bg-blue-900/20 flex items-center justify-center"
                  >
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                      📋 Drop task here
                    </span>
                  </motion.div>
                )}
              </div>
            )}
          </Droppable>
    </motion.div>
  );
}
