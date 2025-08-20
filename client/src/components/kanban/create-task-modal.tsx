import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (taskData: {
    title: string;
    description?: string;
    priority: string;
    columnId: string;
  }) => void;
  columnId: string;
}

export function CreateTaskModal({ isOpen, onClose, onCreateTask, columnId }: CreateTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateTask({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        columnId,
      });
      // Reset form
      setTitle("");
      setDescription("");
      setPriority("medium");
      onClose();
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setTitle("");
    setDescription("");
    setPriority("medium");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md" data-testid="create-task-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium mb-2">
              Task Title *
            </label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              data-testid="input-task-title"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="task-description" className="block text-sm font-medium mb-2">
              Description (optional)
            </label>
            <Textarea
              id="task-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              rows={3}
              data-testid="textarea-task-description"
            />
          </div>

          <div>
            <label htmlFor="task-priority" className="block text-sm font-medium mb-2">
              Priority
            </label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-task-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low Priority</SelectItem>
                <SelectItem value="medium">Medium Priority</SelectItem>
                <SelectItem value="high">High Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-task"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              data-testid="button-create-task"
            >
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}