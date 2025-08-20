import { motion } from "framer-motion";
import { X, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      className="fixed top-20 right-4 z-40 w-64"
    >
      <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-lg border-gray-200/50 dark:border-slate-700/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Map className="w-4 h-4" />
              <CardTitle className="text-sm">Board Overview</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          <div className="flex space-x-2">
            {columns.map((column) => {
              const tasks = tasksByColumn[column.id] || [];
              const colorClass = columnColorClasses[column.color as keyof typeof columnColorClasses] || "bg-gray-300 dark:bg-gray-600";
              
              return (
                <motion.div
                  key={column.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 rounded p-2"
                  style={{ backgroundColor: `${column.color}20` }}
                >
                  <div className="text-xs font-medium mb-1 text-center" style={{ color: column.color }}>
                    {column.title}
                  </div>
                  <div className="space-y-1">
                    {tasks.slice(0, 4).map((task, index) => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`w-full h-1 rounded ${colorClass} ${
                          task.status === "done" ? "opacity-50" : ""
                        }`}
                        title={task.title}
                      />
                    ))}
                    {tasks.length > 4 && (
                      <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                        +{tasks.length - 4} more
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400 text-center mt-3">
            Total: {Object.values(tasksByColumn).flat().length} tasks
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
