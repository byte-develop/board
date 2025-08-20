import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTaskSchema, insertColumnSchema, insertCommentSchema, insertDependencySchema } from "@shared/schema";
import { registerSchema, loginSchema } from "@shared/auth-schema";
import { AuthService } from "./auth";
import OpenAI from "openai";

// Middleware для проверки аутентификации
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const sessionId = req.session.sessionId;
    if (!sessionId) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const user = await AuthService.getUserBySession(sessionId);
    if (!user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Добавляем userId в объект request
    (req as any).userId = user.id;
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || ""
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const user = await AuthService.register(
        validatedData.email,
        validatedData.password,
        validatedData.firstName,
        validatedData.lastName
      );
      
      // Automatically log in after registration
      const { user: loggedInUser, sessionId } = await AuthService.login(validatedData.email, validatedData.password);
      
      // Initialize default data for the new user
      await storage.initializeDefaultDataForUser(loggedInUser.id);
      
      // Set session cookie
      req.session.sessionId = sessionId;
      
      res.status(201).json({ user: loggedInUser });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: error instanceof Error ? error.message : "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const { user, sessionId } = await AuthService.login(validatedData.email, validatedData.password);
      
      // Set session cookie
      req.session.sessionId = sessionId;
      
      res.json({ user });
    } catch (error) {
      console.error("Login error:", error);
      res.status(401).json({ message: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.get("/api/auth/me", async (req, res) => {
    try {
      const sessionId = req.session.sessionId;
      if (!sessionId) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      const user = await AuthService.getUserBySession(sessionId);
      
      if (!user) {
        return res.status(401).json({ message: "Not authenticated" });
      }
      
      res.json({ user });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const sessionId = req.session.sessionId;
      
      if (sessionId) {
        await AuthService.logout(sessionId);
      }
      
      // Clear session
      req.session.destroy((err: any) => {
        if (err) {
          console.error("Session destruction error:", err);
        }
      });
      
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      console.error("Logout error:", error);
      res.status(500).json({ message: "Logout failed" });
    }
  });
  
  // Board routes
  app.get("/api/boards", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const boards = await storage.getAllBoards(userId);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/boards/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const board = await storage.getBoard(req.params.id, userId);
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Column routes
  app.get("/api/boards/:boardId/columns", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const columns = await storage.getColumnsByBoardId(req.params.boardId, userId);
      res.json(columns);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/columns", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertColumnSchema.parse(req.body);
      const column = await storage.createColumn(validatedData, userId);
      res.status(201).json(column);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/columns/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const updates = req.body;
      const column = await storage.updateColumn(req.params.id, updates, userId);
      res.json(column);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/columns/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      await storage.deleteColumn(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Task routes
  app.get("/api/columns/:columnId/tasks", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const tasks = await storage.getTasksByColumnId(req.params.columnId, userId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.get("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const task = await storage.getTask(req.params.id, userId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/tasks", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(validatedData, userId);
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.put("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const updates = req.body;
      const task = await storage.updateTask(req.params.id, updates, userId);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/tasks/:id/move", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { columnId, position } = req.body;
      const task = await storage.moveTask(req.params.id, columnId, position, userId);
      res.json(task);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.delete("/api/tasks/:id", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      await storage.deleteTask(req.params.id, userId);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Comment routes
  app.get("/api/tasks/:taskId/comments", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const comments = await storage.getCommentsByTaskId(req.params.taskId, userId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/comments", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertCommentSchema.parse(req.body);
      const comment = await storage.createComment(validatedData, userId);
      res.status(201).json(comment);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Dependency routes
  app.get("/api/tasks/:taskId/dependencies", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const dependencies = await storage.getDependenciesByTaskId(req.params.taskId, userId);
      res.json(dependencies);
    } catch (error) {
      res.status(500).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/dependencies", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const validatedData = insertDependencySchema.parse(req.body);
      const dependency = await storage.createDependency(validatedData, userId);
      res.status(201).json(dependency);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // AI Assistant routes
  app.post("/api/ai/suggestions", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { boardId } = req.body;
      
      if (!openai.apiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      const columns = await storage.getColumnsByBoardId(boardId, userId);
      const allTasks = [];
      
      for (const column of columns) {
        const tasks = await storage.getTasksByColumnId(column.id, userId);
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

  app.post("/api/ai/optimize-board", requireAuth, async (req, res) => {
    try {
      const userId = (req as any).userId;
      const { boardId } = req.body;
      
      if (!openai.apiKey) {
        return res.status(400).json({ message: "OpenAI API key not configured" });
      }

      const columns = await storage.getColumnsByBoardId(boardId, userId);
      const allTasks = [];
      
      for (const column of columns) {
        const tasks = await storage.getTasksByColumnId(column.id, userId);
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
