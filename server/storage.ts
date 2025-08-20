import { 
  boards, columns, tasks, dependencies, comments,
  type Board, type Column, type Task, type Dependency, type Comment,
  type InsertBoard, type InsertColumn, type InsertTask, type InsertDependency, type InsertComment 
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // Board operations
  getBoard(id: string, userId: string): Promise<Board | undefined>;
  getAllBoards(userId: string): Promise<Board[]>;
  createBoard(board: InsertBoard, userId: string): Promise<Board>;
  updateBoard(id: string, board: Partial<InsertBoard>, userId: string): Promise<Board>;
  deleteBoard(id: string, userId: string): Promise<void>;
  
  // Column operations
  getColumnsByBoardId(boardId: string, userId: string): Promise<Column[]>;
  createColumn(column: InsertColumn, userId: string): Promise<Column>;
  updateColumn(id: string, column: Partial<InsertColumn>, userId: string): Promise<Column>;
  deleteColumn(id: string, userId: string): Promise<void>;
  
  // Task operations
  getTasksByColumnId(columnId: string, userId: string): Promise<Task[]>;
  getTask(id: string, userId: string): Promise<Task | undefined>;
  createTask(task: InsertTask, userId: string): Promise<Task>;
  updateTask(id: string, task: Partial<InsertTask>, userId: string): Promise<Task>;
  deleteTask(id: string, userId: string): Promise<void>;
  moveTask(taskId: string, columnId: string, position: number, userId: string): Promise<Task>;
  
  // Dependency operations
  getDependenciesByTaskId(taskId: string, userId: string): Promise<Dependency[]>;
  createDependency(dependency: InsertDependency, userId: string): Promise<Dependency>;
  deleteDependency(id: string, userId: string): Promise<void>;
  
  // Comment operations
  getCommentsByTaskId(taskId: string, userId: string): Promise<Comment[]>;
  createComment(comment: InsertComment, userId: string): Promise<Comment>;
  deleteComment(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Board operations
  async getBoard(id: string, userId: string): Promise<Board | undefined> {
    const [board] = await db.select().from(boards).where(and(eq(boards.id, id), eq(boards.userId, userId)));
    return board || undefined;
  }

  async getAllBoards(userId: string): Promise<Board[]> {
    return await db.select().from(boards).where(eq(boards.userId, userId));
  }

  async createBoard(insertBoard: InsertBoard, userId: string): Promise<Board> {
    const [board] = await db
      .insert(boards)
      .values({ ...insertBoard, userId })
      .returning();
    return board;
  }

  async updateBoard(id: string, update: Partial<InsertBoard>, userId: string): Promise<Board> {
    const [board] = await db
      .update(boards)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(boards.id, id), eq(boards.userId, userId)))
      .returning();
    
    if (!board) throw new Error("Board not found");
    return board;
  }

  async deleteBoard(id: string, userId: string): Promise<void> {
    await db.delete(boards).where(and(eq(boards.id, id), eq(boards.userId, userId)));
  }

  // Column operations
  async getColumnsByBoardId(boardId: string, userId: string): Promise<Column[]> {
    return await db
      .select()
      .from(columns)
      .where(and(eq(columns.boardId, boardId), eq(columns.userId, userId)))
      .orderBy(columns.position);
  }

  async createColumn(insertColumn: InsertColumn, userId: string): Promise<Column> {
    const [column] = await db
      .insert(columns)
      .values({ ...insertColumn, userId })
      .returning();
    return column;
  }

  async updateColumn(id: string, update: Partial<InsertColumn>, userId: string): Promise<Column> {
    const [column] = await db
      .update(columns)
      .set(update)
      .where(and(eq(columns.id, id), eq(columns.userId, userId)))
      .returning();
    
    if (!column) throw new Error("Column not found");
    return column;
  }

  async deleteColumn(id: string, userId: string): Promise<void> {
    // Delete tasks in this column first
    await db.delete(tasks).where(and(eq(tasks.columnId, id), eq(tasks.userId, userId)));
    // Then delete the column
    await db.delete(columns).where(and(eq(columns.id, id), eq(columns.userId, userId)));
  }

  // Task operations
  async getTasksByColumnId(columnId: string, userId: string): Promise<Task[]> {
    return await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.columnId, columnId), eq(tasks.userId, userId)))
      .orderBy(tasks.position);
  }

  async getTask(id: string, userId: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    return task || undefined;
  }

  async createTask(insertTask: InsertTask, userId: string): Promise<Task> {
    const [task] = await db
      .insert(tasks)
      .values({ ...insertTask, userId })
      .returning();
    return task;
  }

  async updateTask(id: string, update: Partial<InsertTask>, userId: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ ...update, updatedAt: new Date() })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();
    
    if (!task) throw new Error("Task not found");
    return task;
  }

  async deleteTask(id: string, userId: string): Promise<void> {
    // Delete dependencies and comments first
    await db.delete(dependencies).where(eq(dependencies.fromTaskId, id));
    await db.delete(dependencies).where(eq(dependencies.toTaskId, id));
    await db.delete(comments).where(and(eq(comments.taskId, id), eq(comments.userId, userId)));
    // Then delete the task
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
  }

  async moveTask(taskId: string, columnId: string, position: number, userId: string): Promise<Task> {
    const [task] = await db
      .update(tasks)
      .set({ columnId, position, updatedAt: new Date() })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, userId)))
      .returning();
    
    if (!task) throw new Error("Task not found");
    return task;
  }

  // Dependency operations
  async getDependenciesByTaskId(taskId: string, userId: string): Promise<Dependency[]> {
    return await db
      .select()
      .from(dependencies)
      .where(eq(dependencies.fromTaskId, taskId));
  }

  async createDependency(insertDependency: InsertDependency, userId: string): Promise<Dependency> {
    const [dependency] = await db
      .insert(dependencies)
      .values(insertDependency)
      .returning();
    return dependency;
  }

  async deleteDependency(id: string, userId: string): Promise<void> {
    await db.delete(dependencies).where(eq(dependencies.id, id));
  }

  // Comment operations
  async getCommentsByTaskId(taskId: string, userId: string): Promise<Comment[]> {
    return await db
      .select()
      .from(comments)
      .where(and(eq(comments.taskId, taskId), eq(comments.userId, userId)))
      .orderBy(comments.createdAt);
  }

  async createComment(insertComment: InsertComment, userId: string): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values({ ...insertComment, userId })
      .returning();
    return comment;
  }

  async deleteComment(id: string, userId: string): Promise<void> {
    await db.delete(comments).where(and(eq(comments.id, id), eq(comments.userId, userId)));
  }

  // Helper method to initialize default data for new users
  async initializeDefaultDataForUser(userId: string): Promise<void> {
    // Create default board
    const [board] = await db
      .insert(boards)
      .values({
        userId,
        name: "My Kanban Board",
        description: "Персональная доска задач",
      })
      .returning();

    // Create default columns
    const defaultColumns = [
      { title: "Backlog", position: 0, color: "#3b82f6" },
      { title: "In Progress", position: 1, color: "#eab308" },
      { title: "Review", position: 2, color: "#f97316" },
      { title: "Done", position: 3, color: "#10b981" },
    ];

    const createdColumns = [];
    for (const col of defaultColumns) {
      const [column] = await db
        .insert(columns)
        .values({
          boardId: board.id,
          userId,
          title: col.title,
          position: col.position,
          color: col.color,
        })
        .returning();
      createdColumns.push(column);
    }

    // Create sample task
    await db
      .insert(tasks)
      .values({
        columnId: createdColumns[0].id,
        userId,
        title: "Добро пожаловать!",
        description: "Это ваша первая задача. Вы можете редактировать её или создать новые.",
        priority: "medium",
        status: "backlog",
        progress: 0,
        position: 0,
        tags: ["добро пожаловать"],
      });
  }
}

export const storage = new DatabaseStorage();
