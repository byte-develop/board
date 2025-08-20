import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, X, Lightbulb, TrendingUp, Clock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  boardId: string;
}

interface Suggestion {
  type: "priority" | "workflow" | "deadline" | "dependency";
  title: string;
  description: string;
  taskId?: string;
  action: string;
}

const suggestionIcons = {
  priority: Lightbulb,
  workflow: TrendingUp,
  deadline: Clock,
  dependency: Sparkles,
};

const suggestionColors = {
  priority: "from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-500",
  workflow: "from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-500",
  deadline: "from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-500",
  dependency: "from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 border-purple-500",
};

export function AiAssistant({ isOpen, onClose, boardId }: AiAssistantProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const { toast } = useToast();

  const getSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/suggestions", { boardId });
      return response.json();
    },
    onSuccess: (data) => {
      setSuggestions(data.suggestions || []);
    },
    onError: () => {
      toast({
        title: "AI suggestions unavailable",
        description: "Please check your OpenAI API configuration",
        variant: "destructive",
      });
    },
  });

  const optimizeBoardMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/optimize-board", { boardId });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Board optimization complete",
        description: `Generated ${data.optimizations?.length || 0} optimization suggestions`,
      });
    },
    onError: () => {
      toast({
        title: "Optimization failed",
        description: "Please check your OpenAI API configuration",
        variant: "destructive",
      });
    },
  });

  const handleGetSuggestions = () => {
    getSuggestionsMutation.mutate();
  };

  const handleOptimizeBoard = () => {
    optimizeBoardMutation.mutate();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed bottom-6 right-6 z-50 w-80 max-h-96"
    >
      <Card className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-2xl border-gray-200/50 dark:border-slate-700/50 overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm">AI Assistant</CardTitle>
                <p className="text-xs text-gray-500 dark:text-gray-400">Task optimization suggestions</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-3 max-h-64 overflow-y-auto">
          {suggestions.length === 0 ? (
            <div className="text-center py-4">
              <Bot className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Get AI-powered suggestions to optimize your board
              </p>
              <Button
                onClick={handleGetSuggestions}
                disabled={getSuggestionsMutation.isPending}
                size="sm"
                className="w-full"
              >
                {getSuggestionsMutation.isPending ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Suggestions
                  </>
                )}
              </Button>
            </div>
          ) : (
            <AnimatePresence>
              {suggestions.map((suggestion, index) => {
                const Icon = suggestionIcons[suggestion.type];
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-gradient-to-r rounded-lg p-3 border-l-2 ${
                      suggestionColors[suggestion.type]
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      <Icon className="w-4 h-4 mt-0.5 text-current" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                          {suggestion.title}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {suggestion.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </CardContent>

        {suggestions.length > 0 && (
          <div className="p-4 border-t border-gray-200/50 dark:border-slate-700/50">
            <Button
              onClick={handleOptimizeBoard}
              disabled={optimizeBoardMutation.isPending}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
              size="sm"
            >
              {optimizeBoardMutation.isPending ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full mr-2"
                />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              Optimize Board Layout
            </Button>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
