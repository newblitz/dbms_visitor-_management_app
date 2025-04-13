import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { useEffect, useState } from "react";

// Pages
import Dashboard from "@/pages/dashboard";
import Login from "@/pages/login";
import Guard from "@/pages/guard";
import Host from "@/pages/host";
import Admin from "@/pages/admin";
import NotFound from "@/pages/not-found";

// Hooks and types
import { useAuth } from "@/hooks/use-auth";
import { UserRoles } from "@shared/schema";

function ProtectedRoute({ 
  children, 
  allowedRoles = [] 
}: { 
  children: React.ReactNode; 
  allowedRoles?: string[];
}) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    } else if (!isLoading && user && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      // Redirect based on role if user isn't allowed to access this route
      if (user.role === UserRoles.ADMIN) {
        setLocation("/admin");
      } else if (user.role === UserRoles.GUARD) {
        setLocation("/guard");
      } else if (user.role === UserRoles.HOST) {
        setLocation("/host");
      } else {
        setLocation("/login");
      }
    }
  }, [user, isLoading, allowedRoles, setLocation]);

  // Show loading or return children
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!user) {
    return null; // Will redirect in the useEffect
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return null; // Will redirect in the useEffect
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/login" component={Login} />
      
      <Route path="/">
        {() => (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/guard">
        {() => (
          <ProtectedRoute allowedRoles={[UserRoles.GUARD, UserRoles.ADMIN]}>
            <Guard />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/host">
        {() => (
          <ProtectedRoute allowedRoles={[UserRoles.HOST, UserRoles.ADMIN]}>
            <Host />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route path="/admin">
        {() => (
          <ProtectedRoute allowedRoles={[UserRoles.ADMIN]}>
            <Admin />
          </ProtectedRoute>
        )}
      </Route>
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('user');
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem('user');
      }
    }
    
    setIsLoading(false);
  }, []);

  // Create a context value
  const authContextValue = {
    user,
    isLoading,
    login: (userData: any) => {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    },
    logout: () => {
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  // Apply the context value to the context hook
  (useAuth as any).contextValue = authContextValue;

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
