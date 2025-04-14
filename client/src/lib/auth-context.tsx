import React, { useState, useCallback, createContext, useContext, ReactNode } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "./queryClient";
import { UserRole } from "@shared/schema";

interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthState>({
  isAuthenticated: false,
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  checkAuth: async () => false,
});

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const checkAuth = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsAuthenticated(true);
        return true;
      } else {
        setUser(null);
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      
      setUser(userData);
      setIsAuthenticated(true);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${userData.name}!`,
      });
      
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      
      toast({
        title: "Login failed",
        description: (error as Error).message || "Invalid username or password",
        variant: "destructive",
      });
      
      setUser(null);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
      setIsAuthenticated(false);
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    } catch (error) {
      console.error("Logout failed:", error);
      
      toast({
        title: "Logout failed",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  }, [toast]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        loading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}