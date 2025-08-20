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

  // Group tasks by column
  const tasksByColumn = allTasks.reduce((acc: Record<string, Task[]>, task: Task) => {
    if (!acc[task.columnId]) {
      acc[task.columnId] = [];
    }
    acc[task.columnId].push(task);
    return acc;
  }, {});

  // Filter tasks based on search query
  const filteredTasksByColumn = Object.keys(tasksByColumn).reduce((acc: Record<string, Task[]>, columnId) => {
    acc[columnId] = tasksByColumn[columnId].filter(task =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/columns", "tasks"] });
    },
    onError: () => {
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
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-gray-200 dark:border-slate-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="text-white text-sm" />
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Hyper-Kanban</h1>
            </div>
            
            {/* Board Statistics */}
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">Backlog:</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.backlog}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">In Progress:</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.inProgress}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">Review:</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.review}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span className="text-gray-600 dark:text-gray-400">Done:</span>
                <span className="font-medium text-gray-900 dark:text-white">{stats.done}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 w-64 bg-gray-100 dark:bg-slate-700 border-transparent focus:bg-white dark:focus:bg-slate-600"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
            
            {/* Controls */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAiAssistantOpen(!isAiAssistantOpen)}
              className="bg-white/50 dark:bg-slate-700/50 hover:bg-blue-500/10 dark:hover:bg-purple-500/10"
            >
              <Bot className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="bg-white/50 dark:bg-slate-700/50 hover:bg-yellow-500/10"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMiniMapOpen(!isMiniMapOpen)}
              className="bg-white/50 dark:bg-slate-700/50 hover:bg-emerald-500/10"
            >
              <Map className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Board */}
      <main className="flex-1 p-4 overflow-y-auto">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex flex-col lg:flex-row gap-6 min-h-full overflow-x-auto">
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
            <div className="w-80 flex-shrink-0">
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
