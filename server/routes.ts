import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertColumnSchema, insertCommentSchema, insertDependencySchema } from "@shared/schema";
import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Board routes
  app.get("/api/boards", async (req, res) => {
    try {
      const boards = await storage.getAllBoards();
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/boards/:id", async (req, res) => {
    try {
      const board = await storage.getBoard(req.params.id);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Column routes
  app.get("/api/boards/:boardId/columns", async (req, res) => {
    try {
      const columns = await storage.getColumnsByBoardId(req.params.boardId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/columns", async (req, res) => {
    try {
      const validatedData = insertColumnSchema.parse(req.body);
      const column = await storage.createColumn(validatedData);
      res.status(201).json(column);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/columns/:id", async (req, res) => {
    try {
      const updates = req.body;
      const column = await storage.updateColumn(req.params.id, updates);
      res.json(column);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/columns/:id", async (req, res) => {
    try {
      await storage.deleteColumn(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Task routes
  app.get("/api/columns/:columnId/tasks", async (req, res) => {
    try {
      const tasks = await storage.getTasksByColumnId(req.params.columnId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/tasks/:id", async (req, res) => {
    try {
      const task = await storage.getTask(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/tasks/:id/move", async (req, res) => {
    try {
      const { columnId, position } = req.body;
      const task = await storage.moveTask(req.params.id, columnId, position);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Comment routes
  app.get("/api/tasks/:taskId/comments", async (req, res) => {
    try {
      const comments = await storage.getCommentsByTaskId(req.params.taskId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/comments", async (req, res) => {
    try {
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Dependency routes
  app.get("/api/tasks/:taskId/dependencies", async (req, res) => {
    try {
      const dependencies = await storage.getDependenciesByTaskId(req.params.taskId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/dependencies", async (req, res) => {
    try {
      const validatedData = insertDependencySchema.parse(req.body);
      const dependency = await storage.createDependency(validatedData);
      res.status(201).json(dependency);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // AI Assistant routes
  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const { boardId } = req.body;
      
      if (!openai.apiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      const columns = await storage.getColumnsByBoardId(boardId);
      const allTasks = [];
      
      for (const column of columns) {
        const tasks = await storage.getTasksByColumnId(column.id);
        allTasks.push(...tasks.map(task => ({ ...task, columnTitle: column.title })));
      }

      const prompt = `Analyze the following Kanban board data and provide optimization suggestions:

Columns: ${columns.map(c => c.title).join(', ')}

Tasks:
${allTasks.map(task => 
  `- ${task.title} (${task.columnTitle}, Priority: ${task.priority}, Progress: ${task.progress}%, Due: ${task.dueDate || 'No deadline'})`
).join('\n')}

Please provide suggestions in JSON format with the following structure:
{
  "suggestions": [
    {
      "type": "priority" | "workflow" | "deadline" | "dependency",
      "title": "Brief suggestion title",
      "description": "Detailed explanation",
      "taskId": "task-id-if-applicable",
      "action": "specific action to take"
    }
  ]
}`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert project management AI assistant that analyzes Kanban boards and provides actionable optimization suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const suggestions = JSON.parse(response.choices[0].message.content || "{}");
      res.json(suggestions);
    } catch (error) {
      console.error("AI suggestion error:", error);
      res.status(500).json({ message: "Failed to generate AI suggestions" });
    }
  });

  app.post("/api/ai/optimize-board", async (req, res) => {
    try {
      const { boardId } = req.body;
      
      if (!openai.apiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      const columns = await storage.getColumnsByBoardId(boardId);
      const allTasks = [];
      
      for (const column of columns) {
        const tasks = await storage.getTasksByColumnId(column.id);
        allTasks.push(...tasks.map(task => ({ ...task, columnTitle: column.title })));
      }

      const prompt = `Analyze this Kanban board and suggest optimal task organization:

Current state:
${allTasks.map(task => 
  `- ${task.title}: ${task.columnTitle} (Priority: ${task.priority}, Progress: ${task.progress}%)`
).join('\n')}

Provide optimization recommendations in JSON format:
{
  "optimizations": [
    {
      "taskId": "task-id",
      "currentColumn": "current-column-title",
      "suggestedColumn": "suggested-column-title",
      "reason": "explanation for the move"
    }
  ]
}`;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a workflow optimization AI that helps organize Kanban boards for maximum efficiency."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 1000,
      });

      const optimizations = JSON.parse(response.choices[0].message.content || "{}");
      res.json(optimizations);
    } catch (error) {
      console.error("Board optimization error:", error);
      res.status(500).json({ message: "Failed to optimize board" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
