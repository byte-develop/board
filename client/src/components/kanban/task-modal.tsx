import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Save, Trash2, Calendar, Tag, Link as LinkIcon, MessageCircle, Plus } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Task, Comment } from "@shared/schema";

interface TaskModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export function TaskModal({ task, isOpen, onClose, onSave, onDelete }: TaskModalProps) {
  const [editedTask, setEditedTask] = useState<Task | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newTag, setNewTag] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const { data: comments = [] } = useQuery({
    queryKey: ["/api/tasks", task?.id, "comments"],
    enabled: !!task?.id,
  });

  const updateTaskMutation = useMutation({
    mutationFn: async (updates: Partial<Task>) => {
      if (!task) throw new Error("No task selected");
      const response = await apiRequest("PUT", `/api/tasks/${task.id}`, updates);
      return response.json();
    },
    onSuccess: (updatedTask) => {
      queryClient.invalidateQueries({ queryKey: ["/api/columns"] });
      onSave(updatedTask);
      // Убираем уведомление при обновлении задач
    },
    onError: () => {
      toast({ title: "Failed to update task", variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!task) throw new Error("No task selected");
      await apiRequest("DELETE", `/api/tasks/${task.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/columns"] });
      onDelete(task!.id);
      onClose();
      toast({ title: "Task deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete task", variant: "destructive" });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      if (!task) throw new Error("No task selected");
      const response = await apiRequest("POST", "/api/comments", {
        taskId: task.id,
        content,
        author: "You",
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks", task?.id, "comments"] });
      setNewComment("");
      toast({ title: "Comment added" });
    },
    onError: () => {
      toast({ title: "Failed to add comment", variant: "destructive" });
    },
  });

  const handleSave = () => {
    if (!editedTask) return;
    updateTaskMutation.mutate(editedTask);
  };

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTaskMutation.mutate();
    }
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentMutation.mutate(newComment.trim());
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && editedTask) {
      const currentTags = editedTask.tags || [];
      if (!currentTags.includes(newTag.trim())) {
        setEditedTask({
          ...editedTask,
          tags: [...currentTags, newTag.trim()],
        });
        setNewTag("");
      }
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (editedTask) {
      setEditedTask({
        ...editedTask,
        tags: (editedTask.tags || []).filter(tag => tag !== tagToRemove),
      });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  if (!editedTask) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] sm:w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="sr-only">Edit Task</DialogTitle>
          <DialogDescription className="sr-only">
            Edit task details, priority, status, and other properties
          </DialogDescription>
          <div className="w-full">
            <Input
              value={editedTask.title}
              onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
              className="text-xl font-semibold border-none p-0 focus-visible:ring-0 bg-transparent"
              placeholder="Task title..."
              data-testid="input-edit-task-title"
            />
          </div>
          
          <div className="flex items-center space-x-2 flex-wrap">
            <Select
              value={editedTask.priority}
              onValueChange={(value) => setEditedTask({ ...editedTask, priority: value })}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">High Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="low">Low Priority</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={editedTask.status}
              onValueChange={(value) => setEditedTask({ ...editedTask, status: value })}
            >
              <SelectTrigger className="w-auto">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="backlog">Backlog</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="space-y-4 sm:space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={editedTask.description || ""}
              onChange={(e) => setEditedTask({ ...editedTask, description: e.target.value })}
              placeholder="Add task description..."
              rows={4}
            />
          </div>

          {/* Due Date and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Due Date</label>
              <Input
                type="date"
                value={editedTask.dueDate ? new Date(editedTask.dueDate).toISOString().split('T')[0] : ""}
                onChange={(e) => setEditedTask({ 
                  ...editedTask, 
                  dueDate: e.target.value ? new Date(e.target.value) : null 
                })}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Progress: {editedTask.progress}%</label>
              <Slider
                value={[editedTask.progress]}
                onValueChange={([value]) => setEditedTask({ ...editedTask, progress: value })}
                max={100}
                step={5}
                className="mt-2"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium mb-2">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <AnimatePresence>
                {editedTask.tags?.map((tag) => (
                  <motion.div
                    key={tag}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                  >
                    <Badge variant="secondary" className="cursor-pointer" onClick={() => handleRemoveTag(tag)}>
                      {tag} <X className="h-3 w-3 ml-1" />
                    </Badge>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                onKeyDown={(e) => handleKeyDown(e, handleAddTag)}
                className="flex-1"
              />
              <Button onClick={handleAddTag} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium mb-2">Comments</label>
            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              <AnimatePresence>
                {(comments as Comment[]).map((comment: Comment) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-slate-700 rounded-lg p-3"
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                        {comment.author.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(comment.createdAt!).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                Y
              </div>
              <div className="flex-1 flex space-x-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      handleAddComment();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddComment} 
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  size="sm"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0 pt-4 sm:pt-6 border-t">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteTaskMutation.isPending}
            className="order-2 sm:order-1"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Task
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 order-1 sm:order-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updateTaskMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
