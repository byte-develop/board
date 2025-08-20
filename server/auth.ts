import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db';
import { users, sessions, type AuthUser, type AuthSession } from '../shared/auth-schema';
import config from './config';
import { nanoid } from 'nanoid';

export class AuthService {
  // Регистрация пользователя
  static async register(email: string, password: string, firstName: string, lastName: string): Promise<AuthUser> {
    // Проверяем, существует ли пользователь
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      throw new Error('User already exists');
    }

    // Хешируем пароль
    const passwordHash = await bcrypt.hash(password, config.auth.bcryptRounds);

    // Создаем пользователя
    const [user] = await db.insert(users).values({
      id: nanoid(),
      email,
      passwordHash,
      firstName,
      lastName,
    }).returning();

    return user;
  }

  // Авторизация пользователя
  static async login(email: string, password: string): Promise<{ user: AuthUser; sessionId: string }> {
    // Находим пользователя
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Проверяем пароль
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Создаем сессию
    const sessionId = nanoid();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 часа

    await db.insert(sessions).values({
      id: sessionId,
      userId: user.id,
      expiresAt,
    });

    return { user, sessionId };
  }

  // Получение пользователя по сессии
  static async getUserBySession(sessionId: string): Promise<AuthUser | null> {
    if (!sessionId) return null;

    const [session] = await db.select().from(sessions).where(eq(sessions.id, sessionId)).limit(1);
    if (!session || session.expiresAt < new Date()) {
      // Удаляем истекшую сессию
      if (session) {
        await db.delete(sessions).where(eq(sessions.id, sessionId));
      }
      return null;
    }

    const [user] = await db.select().from(users).where(eq(users.id, session.userId)).limit(1);
    return user || null;
  }

  // Выход из системы
  static async logout(sessionId: string): Promise<void> {
    if (sessionId) {
      await db.delete(sessions).where(eq(sessions.id, sessionId));
    }
  }

  // Обновление профиля пользователя
  static async updateProfile(userId: string, updates: Partial<Pick<AuthUser, 'firstName' | 'lastName' | 'profileImageUrl'>>): Promise<AuthUser> {
    const [user] = await db.update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Очистка истекших сессий
  static async cleanupExpiredSessions(): Promise<void> {
    await db.delete(sessions).where(eq(sessions.expiresAt, new Date()));
  }
}