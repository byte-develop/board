import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface CreateColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateColumn: (title: string) => void;
}

export function CreateColumnModal({ isOpen, onClose, onCreateColumn }: CreateColumnModalProps) {
  const [title, setTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      onCreateColumn(title.trim());
      setTitle("");
      onClose();
    }
  };

  const handleClose = () => {
    setTitle("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[calc(100vw-1rem)] sm:w-full" data-testid="create-column-modal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create New Column
          </DialogTitle>
          <DialogDescription>
            Create a new column to organize your tasks.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="column-title" className="block text-sm font-medium mb-2">
              Column Title *
            </label>
            <Input
              id="column-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter column title..."
              data-testid="input-column-title"
              autoFocus
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 sm:pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              data-testid="button-cancel-column"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim()}
              data-testid="button-create-column"
            >
              Create Column
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}