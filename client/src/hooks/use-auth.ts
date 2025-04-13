import { useEffect, useState } from "react";

// Type for the user object
export interface AuthUser {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  active: boolean;
}

// Type for the auth context value
interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
}

// Starting with an empty context value
let contextValue: AuthContextValue = {
  user: null,
  isLoading: true,
  login: () => {},
  logout: () => {}
};

// This hook returns the authentication context
export function useAuth(): AuthContextValue {
  // Access the context value that has been set by the AuthProvider
  if ((useAuth as any).contextValue) {
    return (useAuth as any).contextValue;
  }
  
  // Fallback to the initial value if for some reason the context isn't set
  return contextValue;
}

// Hook for logging in
export function useLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const handleLogin = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.user);
      return data.user;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { handleLogin, isLoading, error };
}

// Hook for checking if a user has certain permissions
export function useAuthPermission(allowedRoles: string[]) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    if (user && allowedRoles.includes(user.role)) {
      setHasPermission(true);
    } else {
      setHasPermission(false);
    }
  }, [user, allowedRoles]);

  return hasPermission;
}
