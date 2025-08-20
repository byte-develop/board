import { motion } from "framer-motion";
import { X, Map, TrendingUp, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Column, Task } from "@shared/schema";

interface MiniMapProps {
  isOpen: boolean;
  onClose: () => void;
  columns: Column[];
  tasksByColumn: Record<string, Task[]>;
}

const columnColorClasses = {
  "#3b82f6": "bg-blue-300 dark:bg-blue-600",
  "#eab308": "bg-yellow-300 dark:bg-yellow-600",
  "#f97316": "bg-orange-300 dark:bg-orange-600",
  "#10b981": "bg-emerald-300 dark:bg-emerald-600",
};

export function MiniMap({ isOpen, onClose, columns, tasksByColumn }: MiniMapProps) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-16 sm:top-20 right-2 sm:right-4 z-40 w-[calc(100vw-1rem)] max-w-md sm:w-96 max-h-[80vh] overflow-hidden"
    >
      <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl shadow-2xl border-gray-200/30 dark:border-slate-700/30 ring-1 ring-black/5 dark:ring-white/5">
        <CardHeader className="pb-4 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 dark:from-blue-400/20 dark:via-purple-400/20 dark:to-pink-400/20 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/80 dark:bg-slate-700/80 rounded-lg shadow-sm">
                <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base font-semibold">Board Analytics</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Real-time overview</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0 hover:bg-white/80 dark:hover:bg-slate-700/80 rounded-lg">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 max-h-[calc(80vh-6rem)] overflow-y-auto custom-scrollbar">
          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-2 sm:p-2.5 rounded-lg border border-blue-200/50 dark:border-blue-700/50">
              <div className="flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs sm:text-sm font-medium text-blue-900 dark:text-blue-100">Active</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-blue-900 dark:text-blue-100 mt-0.5 sm:mt-1">
                {Object.values(tasksByColumn).flat().filter(t => t.status !== 'done').length}
              </div>
            </div>
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 p-2 sm:p-2.5 rounded-lg border border-emerald-200/50 dark:border-emerald-700/50">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs sm:text-sm font-medium text-emerald-900 dark:text-emerald-100">Done</span>
              </div>
              <div className="text-sm sm:text-base font-bold text-emerald-900 dark:text-emerald-100 mt-0.5 sm:mt-1">
                {(tasksByColumn['done'] || []).length}
              </div>
            </div>
          </div>

          {/* Column Overview */}
          <div className="space-y-3 sm:space-y-4">
            {columns.map((column) => {
              const tasks = tasksByColumn[column.id] || [];
              const totalTasks = Object.values(tasksByColumn).flat().length;
              const percentage = totalTasks > 0 ? (tasks.length / totalTasks) * 100 : 0;
              
              let icon = Clock;
              if (column.id === 'done') icon = CheckCircle2;
              else if (column.id === 'in-progress') icon = TrendingUp;
              else if (column.id === 'review') icon = AlertCircle;
              
              const Icon = icon;
              
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: columns.indexOf(column) * 0.1 }}
                  className="bg-white/50 dark:bg-slate-700/30 rounded-lg p-2.5 sm:p-3 border border-gray-200/50 dark:border-slate-600/50 hover:border-gray-300/70 dark:hover:border-slate-500/70 transition-all duration-200"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${column.color}20` }}>
                        <Icon className="w-4 h-4" style={{ color: column.color }} />
                      </div>
                      <div>
                        <div className="font-medium text-sm" style={{ color: column.color }}>
                          {column.title}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {Math.round(percentage)}%
                      </div>
                    </div>
                  </div>
                  
                  <Progress value={percentage} className="h-2" style={{
                    ['--progress-background' as any]: `${column.color}20`,
                    ['--progress-foreground' as any]: column.color
                  }} />
                  
                  {tasks.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {tasks.slice(0, 2).map((task, index) => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (columns.indexOf(column) * 0.1) + (index * 0.05) }}
                          className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors cursor-pointer"
                          title={task.description || task.title}
                        >
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: column.color }} />
                          <span className="truncate flex-1">{task.title}</span>
                        </motion.div>
                      ))}
                      {tasks.length > 2 && (
                        <div className="text-xs text-gray-400 dark:text-gray-500 ml-3.5">
                          +{tasks.length - 2} more tasks
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Summary */}
          <div className="pt-4 border-t border-gray-200/50 dark:border-slate-600/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Total Progress</span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {Object.values(tasksByColumn).flat().length} tasks
              </span>
            </div>
            <Progress 
              value={(tasksByColumn['done']?.length || 0) / Math.max(Object.values(tasksByColumn).flat().length, 1) * 100} 
              className="h-2 mt-2" 
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}