import { 
  type Board, type Column, type Task, type Dependency, type Comment,
  type InsertBoard, type InsertColumn, type InsertTask, type InsertDependency, type InsertComment 
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Board operations
  getBoard(id: string): Promise<Board | undefined>;
  getAllBoards(): Promise<Board[]>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>): Promise<Board>;
  deleteBoard(id: string): Promise<void>;
  
  // Column operations
  getColumnsByBoardId(boardId: string): Promise<Column[]>;
  createColumn(column: InsertColumn): Promise<Column>;
  updateColumn(id: string, column: Partial<InsertColumn>): Promise<Column>;
  deleteColumn(id: string): Promise<void>;
  
  // Task operations
  getTasksByColumnId(columnId: string): Promise<Task[]>;
  getTask(id: string): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  moveTask(taskId: string, columnId: string, position: number): Promise<Task>;
  
  // Dependency operations
  getDependenciesByTaskId(taskId: string): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency): Promise<Dependency>;
  deleteDependency(id: string): Promise<void>;
  
  // Comment operations
  getCommentsByTaskId(taskId: string): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private boards: Map<string, Board> = new Map();
  private columns: Map<string, Column> = new Map();
  private tasks: Map<string, Task> = new Map();
  private dependencies: Map<string, Dependency> = new Map();
  private comments: Map<string, Comment> = new Map();

  constructor() {
    this.initializeDefaultData();
  }

  private initializeDefaultData() {
    // Create default board
    const defaultBoard: Board = {
      id: "default-board",
      name: "Hyper-Kanban",
      description: "Interactive task management board",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.boards.set(defaultBoard.id, defaultBoard);

    // Create default columns
    const defaultColumns: Column[] = [
      {
        id: "backlog",
        boardId: "default-board",
        title: "Backlog",
        position: 0,
        color: "#3b82f6",
        createdAt: new Date(),
      },
      {
        id: "in-progress",
        boardId: "default-board",
        title: "In Progress",
        position: 1,
        color: "#eab308",
        createdAt: new Date(),
      },
      {
        id: "review",
        boardId: "default-board",
        title: "Review",
        position: 2,
        color: "#f97316",
        createdAt: new Date(),
      },
      {
        id: "done",
        boardId: "default-board",
        title: "Done",
        position: 3,
        color: "#10b981",
        createdAt: new Date(),
      },
    ];

    defaultColumns.forEach(column => {
      this.columns.set(column.id, column);
    });

    // Create sample tasks
    const sampleTasks: Task[] = [
      {
        id: "task-1",
        columnId: "backlog",
        title: "Design new landing page",
        description: "Create wireframes and mockups for the new company landing page",
        priority: "high",
        status: "backlog",
        progress: 0,
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        tags: ["design", "ui/ux"],
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "task-2",
        columnId: "backlog",
        title: "Setup project database",
        description: "Configure PostgreSQL database with initial tables",
        priority: "medium",
        status: "backlog",
        progress: 0,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        tags: ["backend", "database"],
        position: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "task-3",
        columnId: "in-progress",
        title: "Implement user authentication",
        description: "Add login/register functionality with JWT tokens",
        priority: "high",
        status: "in-progress",
        progress: 45,
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        tags: ["backend", "auth"],
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "task-4",
        columnId: "review",
        title: "Code review for API endpoints",
        description: "Review and test all REST API endpoints before deployment",
        priority: "medium",
        status: "review",
        progress: 90,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        tags: ["review", "api"],
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "task-5",
        columnId: "done",
        title: "Project initialization",
        description: "Setup basic project structure and dependencies",
        priority: "low",
        status: "done",
        progress: 100,
        dueDate: null,
        tags: ["setup"],
        position: 0,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
    ];

    sampleTasks.forEach(task => {
      this.tasks.set(task.id, task);
    });
  }

  // Board operations
  async getBoard(id: string): Promise<Board | undefined> {
    return this.boards.get(id);
  }

  async getAllBoards(): Promise<Board[]> {
    return Array.from(this.boards.values());
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = randomUUID();
    const board: Board = {
      id,
      name: insertBoard.name,
      description: insertBoard.description || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.boards.set(id, board);
    return board;
  }

  async updateBoard(id: string, update: Partial<InsertBoard>): Promise<Board> {
    const board = this.boards.get(id);
    if (!board) throw new Error("Board not found");
    
    const updatedBoard = { ...board, ...update, updatedAt: new Date() };
    this.boards.set(id, updatedBoard);
    return updatedBoard;
  }

  async deleteBoard(id: string): Promise<void> {
    this.boards.delete(id);
  }

  // Column operations
  async getColumnsByBoardId(boardId: string): Promise<Column[]> {
    return Array.from(this.columns.values())
      .filter(column => column.boardId === boardId)
      .sort((a, b) => a.position - b.position);
  }

  async createColumn(insertColumn: InsertColumn): Promise<Column> {
    const id = randomUUID();
    const column: Column = {
      id,
      boardId: insertColumn.boardId,
      title: insertColumn.title,
      position: insertColumn.position,
      color: insertColumn.color || "#3b82f6",
      createdAt: new Date(),
    };
    this.columns.set(id, column);
    return column;
  }

  async updateColumn(id: string, update: Partial<InsertColumn>): Promise<Column> {
    const column = this.columns.get(id);
    if (!column) throw new Error("Column not found");
    
    const updatedColumn = { ...column, ...update };
    this.columns.set(id, updatedColumn);
    return updatedColumn;
  }

  async deleteColumn(id: string): Promise<void> {
    this.columns.delete(id);
    // Also delete tasks in this column
    Array.from(this.tasks.values())
      .filter(task => task.columnId === id)
      .forEach(task => this.tasks.delete(task.id));
  }

  // Task operations
  async getTasksByColumnId(columnId: string): Promise<Task[]> {
    return Array.from(this.tasks.values())
      .filter(task => task.columnId === columnId)
      .sort((a, b) => a.position - b.position);
  }

  async getTask(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = randomUUID();
    const task: Task = {
      id,
      columnId: insertTask.columnId,
      title: insertTask.title,
      description: insertTask.description || null,
      priority: insertTask.priority || "medium",
      status: insertTask.status || "backlog",
      progress: insertTask.progress || 0,
      dueDate: insertTask.dueDate || null,
      tags: insertTask.tags || [],
      position: insertTask.position,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, update: Partial<InsertTask>): Promise<Task> {
    const task = this.tasks.get(id);
    if (!task) throw new Error("Task not found");
    
    const updatedTask = { ...task, ...update, updatedAt: new Date() };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
    // Also delete dependencies and comments
    Array.from(this.dependencies.values())
      .filter(dep => dep.fromTaskId === id || dep.toTaskId === id)
      .forEach(dep => this.dependencies.delete(dep.id));
    
    Array.from(this.comments.values())
      .filter(comment => comment.taskId === id)
      .forEach(comment => this.comments.delete(comment.id));
  }

  async moveTask(taskId: string, columnId: string, position: number): Promise<Task> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error("Task not found");
    
    const updatedTask = { ...task, columnId, position, updatedAt: new Date() };
    this.tasks.set(taskId, updatedTask);
    return updatedTask;
  }

  // Dependency operations
  async getDependenciesByTaskId(taskId: string): Promise<Dependency[]> {
    return Array.from(this.dependencies.values())
      .filter(dep => dep.fromTaskId === taskId || dep.toTaskId === taskId);
  }

  async createDependency(insertDependency: InsertDependency): Promise<Dependency> {
    const id = randomUUID();
    const dependency: Dependency = {
      ...insertDependency,
      id,
      createdAt: new Date(),
    };
    this.dependencies.set(id, dependency);
    return dependency;
  }

  async deleteDependency(id: string): Promise<void> {
    this.dependencies.delete(id);
  }

  // Comment operations
  async getCommentsByTaskId(taskId: string): Promise<Comment[]> {
    return Array.from(this.comments.values())
      .filter(comment => comment.taskId === taskId)
      .sort((a, b) => (a.createdAt?.getTime() || 0) - (b.createdAt?.getTime() || 0));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const id = randomUUID();
    const comment: Comment = {
      id,
      taskId: insertComment.taskId,
      content: insertComment.content,
      author: insertComment.author || "You",
      createdAt: new Date(),
    };
    this.comments.set(id, comment);
    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    this.comments.delete(id);
  }
}

export const storage = new MemStorage();
