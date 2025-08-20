import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Search, Sun, Moon, Bot, Map } from "lucide-react";
import { KanbanColumn } from "./kanban-column";
import { TaskModal } from "./task-modal";
import { AiAssistant } from "./ai-assistant";
import { MiniMap } from "./mini-map";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "./theme-provider";
import type { Column, Task } from "@shared/schema";

export function KanbanBoard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isMiniMapOpen, setIsMiniMapOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const boardId = "default-board";

  // Fetch columns
  const { data: columns = [], isLoading: columnsLoading } = useQuery<Column[]>({
    queryKey: ["/api/boards", boardId, "columns"],
  });

  // Fetch tasks for all columns
  const { data: allTasks = [], isLoading: tasksLoading } = useQuery<Task[]>({
    queryKey: ["/api/columns", "tasks"],
    queryFn: async () => {
      const allTasks: Task[] = [];
      for (const column of columns) {
        const response = await fetch(`/api/columns/${column.id}/tasks`);
        if (response.ok) {
          const tasks = await response.json();
          allTasks.push(...tasks);
        }
      }
      return allTasks;
    },
    enabled: columns.length > 0,
  });

  // Group tasks by column and sort by position
  const tasksByColumn = allTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!acc[task.columnId]) {
      acc[task.columnId] = [];
    }
    acc[task.columnId].push(task);
    return acc;
  }, {});

  // Sort tasks by position within each column
  Object.keys(tasksByColumn).forEach(columnId => {
    tasksByColumn[columnId].sort((a, b) => a.position - b.position);
  });

  // Filter tasks based on search query and maintain position sorting
  const filteredTasksByColumn = Object.keys(tasksByColumn).reduce((acc: Record<string, Task[]>, columnId) => {
    acc[columnId] = tasksByColumn[columnId]
      .filter(task =>
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      )
      .sort((a, b) => a.position - b.position);
    return acc;
  }, {});

  // Mutations
  const moveTaskMutation = useMutation({
    mutationFn: async ({ taskId, columnId, position }: { taskId: string; columnId: string; position: number }) => {
      // Also update the status to match the column
      let status = "backlog";
      if (columnId === "in-progress") status = "in-progress";
      else if (columnId === "review") status = "review";
      else if (columnId === "done") status = "done";
      
      const response = await apiRequest("POST", `/api/tasks/${taskId}/move`, { columnId, position });
      
      // Update status to match new column
      await apiRequest("PUT", `/api/tasks/${taskId}`, { status });
      
      return response.json();
    },
    // Простое оптимистичное обновление
    onMutate: async ({ taskId, columnId, position }) => {
      // Отменяем любые исходящие refetch запросы
      await queryClient.cancelQueries({ queryKey: ["/api/columns", "tasks"] });
      
      // Получаем текущие данные
      const previousTasks = queryClient.getQueryData<Task[]>(["/api/columns", "tasks"]);
      
      if (previousTasks) {
        let status = "backlog";
        if (columnId === "in-progress") status = "in-progress";
        else if (columnId === "review") status = "review";
        else if (columnId === "done") status = "done";

        // Просто обновляем задачу с новыми данными
        const updatedTasks = previousTasks.map(task => {
          if (task.id === taskId) {
            return { ...task, columnId, position, status };
          }
          return task;
        });
        
        // Устанавливаем обновлённые данные
        queryClient.setQueryData(["/api/columns", "tasks"], updatedTasks);
      }
      
      // Возвращаем контекст для rollback в случае ошибки
      return { previousTasks };
    },
    onSuccess: () => {
      // Обновляем данные с сервера для синхронизации
      queryClient.invalidateQueries({ queryKey: ["/api/columns", "tasks"] });
    },
    onError: (err, variables, context) => {
      // Откатываем изменения в случае ошибки
      if (context?.previousTasks) {
        queryClient.setQueryData(["/api/columns", "tasks"], context.previousTasks);
      }
      toast({ title: "Failed to move task", variant: "destructive" });
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async ({ columnId, title }: { columnId: string; title: string }) => {
      const tasks = tasksByColumn[columnId] || [];
      const position = tasks.length;
      
      const response = await apiRequest("POST", "/api/tasks", {
        columnId,
        title,
        description: "",
        priority: "medium",
        status: "backlog",
        progress: 0,
        position,
        tags: [],
      });
      return response.json();
    },
    onSuccess: (newTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/columns", "tasks"] });
      setSelectedTask(newTask);
      setIsTaskModalOpen(true);
    },
    onError: () => {
      toast({ title: "Failed to create task", variant: "destructive" });
    },
  });

  const createColumnMutation = useMutation({
    mutationFn: async (title: string) => {
      const response = await apiRequest("POST", "/api/columns", {
        boardId,
        title,
        position: columns.length,
        color: "#6366f1",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/boards", boardId, "columns"] });
      toast({ title: "Column created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create column", variant: "destructive" });
    },
  });

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    moveTaskMutation.mutate({
      taskId: draggableId,
      columnId: destination.droppableId,
      position: destination.index,
    });
  };

  const handleAddTask = (columnId: string) => {
    const title = prompt("Enter task title:");
    if (title?.trim()) {
      createTaskMutation.mutate({ columnId, title: title.trim() });
    }
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (updatedTask: Task) => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId: string) => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };

  const handleAddColumn = () => {
    const title = prompt("Enter column title:");
    if (title?.trim()) {
      createColumnMutation.mutate(title.trim());
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        toggleTheme();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsAiAssistantOpen(!isAiAssistantOpen);
      }
      if (e.key === "Escape") {
        setIsTaskModalOpen(false);
        setIsAiAssistantOpen(false);
        setIsMiniMapOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [toggleTheme, isAiAssistantOpen]);

  // Calculate stats based on actual column placement
  const stats = {
    backlog: (tasksByColumn['backlog'] || []).length,
    inProgress: (tasksByColumn['in-progress'] || []).length,
    review: (tasksByColumn['review'] || []).length,
    done: (tasksByColumn['done'] || []).length,
  };

  if (columnsLoading || tasksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-purple-900 transition-all duration-500">
      {/* Header */}
      <header className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl border-b border-gray-200/60 dark:border-slate-700/60 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 dark:shadow-purple-500/25">
                <Bot className="text-white w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Hyper-Kanban
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-0.5">Project Management</p>
              </div>
            </div>
            
            {/* Board Statistics */}
            <div className="hidden lg:flex items-center space-x-1 ml-8 bg-gray-50/80 dark:bg-slate-700/30 rounded-2xl px-4 py-2.5 border border-gray-200/50 dark:border-slate-600/50">
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-900/20 border border-blue-200/50 dark:border-blue-700/50">
                <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-sm shadow-blue-500/50"></div>
                <span className="text-xs font-medium text-blue-700 dark:text-blue-300">Backlog</span>
                <span className="text-sm font-bold text-blue-900 dark:text-blue-100 bg-blue-100/80 dark:bg-blue-800/50 px-2 py-0.5 rounded-lg min-w-[24px] text-center">{stats.backlog}</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-amber-50/80 dark:bg-amber-900/20 border border-amber-200/50 dark:border-amber-700/50">
                <div className="w-2.5 h-2.5 bg-amber-500 rounded-full shadow-sm shadow-amber-500/50"></div>
                <span className="text-xs font-medium text-amber-700 dark:text-amber-300">Active</span>
                <span className="text-sm font-bold text-amber-900 dark:text-amber-100 bg-amber-100/80 dark:bg-amber-800/50 px-2 py-0.5 rounded-lg min-w-[24px] text-center">{stats.inProgress}</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-orange-50/80 dark:bg-orange-900/20 border border-orange-200/50 dark:border-orange-700/50">
                <div className="w-2.5 h-2.5 bg-orange-500 rounded-full shadow-sm shadow-orange-500/50"></div>
                <span className="text-xs font-medium text-orange-700 dark:text-orange-300">Review</span>
                <span className="text-sm font-bold text-orange-900 dark:text-orange-100 bg-orange-100/80 dark:bg-orange-800/50 px-2 py-0.5 rounded-lg min-w-[24px] text-center">{stats.review}</span>
              </div>
              <div className="flex items-center space-x-3 px-3 py-1.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/50">
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm shadow-emerald-500/50"></div>
                <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">Done</span>
                <span className="text-sm font-bold text-emerald-900 dark:text-emerald-100 bg-emerald-100/80 dark:bg-emerald-800/50 px-2 py-0.5 rounded-lg min-w-[24px] text-center">{stats.done}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search tasks, tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 w-72 bg-white/80 dark:bg-slate-700/80 border-gray-200/60 dark:border-slate-600/60 focus:bg-white dark:focus:bg-slate-600 focus:border-blue-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-blue-400/20 dark:focus:ring-purple-400/20 rounded-xl shadow-sm placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            {/* Controls */}
            <div className="flex items-center space-x-2 bg-white/60 dark:bg-slate-700/60 rounded-2xl p-1.5 border border-gray-200/50 dark:border-slate-600/50 shadow-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
                className={`h-9 w-9 p-0 rounded-xl transition-all duration-200 ${
                  isAiAssistantOpen 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                }`}
                title="AI Assistant"
              >
                <Bot className="w-4 h-4" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/20 text-amber-600 dark:text-amber-400 transition-all duration-200"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMiniMapOpen(!isMiniMapOpen)}
                className={`h-9 w-9 p-0 rounded-xl transition-all duration-200 ${
                  isMiniMapOpen 
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/30' 
                    : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                }`}
                title="Board Analytics"
              >
                <Map className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-4">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-wrap gap-6 min-h-full">
            {columns.map((column: Column, index: number) => (
              <KanbanColumn
                key={column.id}
                column={column}
                tasks={filteredTasksByColumn[column.id] || []}
                onAddTask={handleAddTask}
                onEditTask={handleEditTask}
                index={index}
              />
            ))}
                  
            
            {/* Add Column Button */}
            <div className="w-80">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleAddColumn}
                className="w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-all duration-200 flex flex-col items-center justify-center space-y-2 group"
              >
                <Plus className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 text-2xl" />
                <span className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 text-sm font-medium">
                  Add Column
                </span>
              </motion.button>
            </div>
          </div>
        </DragDropContext>
      </main>

      {/* Modals and Overlays */}
      <TaskModal
        task={selectedTask}
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      <AiAssistant
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        boardId={boardId}
      />

      <MiniMap
        isOpen={isMiniMapOpen}
        onClose={() => setIsMiniMapOpen(false)}
        columns={columns as Column[]}
        tasksByColumn={tasksByColumn}
      />
    </div>
  );
}
