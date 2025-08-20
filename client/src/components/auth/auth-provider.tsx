import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Получение текущего пользователя
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/me');
        const data = await response.json();
        return data.user;
      } catch (error: any) {
        if (error.message.includes('401')) {
          return null; // Не аутентифицирован
        }
        throw error;
      }
    },
    retry: false,
  });

  // Мутация для входа
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      const data = await response.json();
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
    },
  });

  // Мутация для регистрации
  const registerMutation = useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      firstName, 
      lastName 
    }: { 
      email: string; 
      password: string; 
      firstName: string; 
      lastName: string; 
    }) => {
      const response = await apiRequest('POST', '/api/auth/register', {
        email,
        password,
        firstName,
        lastName,
      });
      const data = await response.json();
      return data.user;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(['/api/auth/me'], user);
      queryClient.invalidateQueries({ queryKey: ['/api/boards'] });
    },
  });

  // Мутация для выхода
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
    },
  });

  useEffect(() => {
    if (!isLoading) {
      setIsInitialized(true);
    }
  }, [isLoading]);

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    await registerMutation.mutateAsync({ email, password, firstName, lastName });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const isAuthenticated = !!user && !error;
  const contextIsLoading = isLoading || !isInitialized;

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading: contextIsLoading,
        isAuthenticated,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}