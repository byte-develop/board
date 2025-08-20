import { motion, AnimatePresence } from "framer-motion";
import { Plus, MoreHorizontal } from "lucide-react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
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
      className="w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm rounded-xl border border-gray-200/50 dark:border-slate-700/50 shadow-lg"
    >
      <div className="p-4 border-b border-gray-200/50 dark:border-slate-700/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: column.color }}
                />
                <h3 className="font-semibold text-gray-900 dark:text-white">{column.title}</h3>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  columnColors[column.color as keyof typeof columnColors] || 
                  "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                }`}>
                  {tasks.length}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onAddTask(column.id)}
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-3 bg-gray-200 dark:bg-slate-700 rounded-full h-1 overflow-hidden">
              <motion.div 
                className="h-full rounded-full"
                style={{ backgroundColor: column.color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </div>
          </div>

          <Droppable droppableId={column.id} type="task">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`p-4 min-h-96 transition-colors duration-200 ${
                  snapshot.isDraggingOver 
                    ? "bg-blue-50/50 dark:bg-blue-900/10" 
                    : ""
                }`}
              >
                {tasks.map((task, taskIndex) => (
                  <Draggable key={task.id} draggableId={task.id} index={taskIndex}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          ...provided.draggableProps.style,
                          marginBottom: '12px',
                          // Исправляем позиционирование для правильной работы с курсором
                          ...(snapshot.isDragging && {
                            transform: provided.draggableProps.style?.transform?.replace(/translate3d\(([^,]+), ([^,]+), ([^)]+)\)/, (match, x, y, z) => {
                              // Получаем текущие координаты и корректируем их
                              const xVal = parseFloat(x);
                              const yVal = parseFloat(y);
                              // Смещаем элемент к центру курсора
                              return `translate3d(${xVal}px, ${yVal}px, ${z})`;
                            }) + ' rotate(3deg)',
                            transformOrigin: '50% 50%',
                            zIndex: 9999,
                          })
                        }}
                      >
                        <TaskCard
                          task={task}
                          onEdit={onEditTask}
                          isDragging={snapshot.isDragging}
                        />
                      </div>
                    )}
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
