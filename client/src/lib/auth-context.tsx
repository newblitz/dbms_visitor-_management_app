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
      // Initially, we'll set authentication to false to start with
      setUser(null);
      setIsAuthenticated(false);
      
      // For the initial version, let's bypass the authentication check
      // since we're still setting up the backend
      console.log("Authentication check bypassed for development");
      setLoading(false);
      return false;
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
      
      // For development, simulate different user roles based on username
      let mockUser: User;
      
      if (username.toLowerCase() === 'admin') {
        mockUser = {
          id: 1,
          username: 'admin',
          name: 'Admin User',
          email: 'admin@example.com',
          role: UserRole.ADMIN,
          department: 'Administration'
        };
      } else if (username.toLowerCase() === 'guard') {
        mockUser = {
          id: 2,
          username: 'guard',
          name: 'Security Guard',
          email: 'guard@example.com',
          role: UserRole.GUARD
        };
      } else if (username.toLowerCase() === 'host') {
        mockUser = {
          id: 3,
          username: 'host',
          name: 'Department Host',
          email: 'host@example.com',
          role: UserRole.HOST,
          department: 'Human Resources'
        };
      } else {
        // Default to guard for any other username
        mockUser = {
          id: 4,
          username: username,
          name: 'New User',
          email: `${username}@example.com`,
          role: UserRole.GUARD
        };
      }
      
      // Simple password validation for development (at least try to check the password)
      if (password.length < 4) {
        throw new Error("Invalid password");
      }
      
      setUser(mockUser);
      setIsAuthenticated(true);
      
      toast({
        title: "Logged in successfully",
        description: `Welcome back, ${mockUser.name}! You are logged in as ${mockUser.role}.`,
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