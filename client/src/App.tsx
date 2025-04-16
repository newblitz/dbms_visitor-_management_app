import { Switch, Route } from "wouter";
import { useEffect, useState } from "react";
import { useAuth } from "./lib/auth-context";

// Pages
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import RegisterVisitor from "@/pages/guard/register-visitor";
import VisitorsList from "@/pages/guard/visitors-list";
import ApproveVisitors from "@/pages/host/approve-visitors";
import VisitorHistory from "@/pages/host/visitor-history";
import UsersPage from "@/pages/admin/users";
import SettingsPage from "@/pages/admin/settings";
import DevicesPage from "@/pages/admin/devices";
import ReportsPage from "@/pages/admin/reports";
import NotFound from "@/pages/not-found";

function PrivateRoute({ role, component: Component, ...rest }: { role?: string[] | string, component: React.ComponentType<any>, [x: string]: any }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Check if user's role matches the required role
  const hasRequiredRole = !role || 
    (user && (
      (Array.isArray(role) && role.includes(user.role)) || 
      (typeof role === 'string' && user.role === role)
    ));

  if (loading) {
    // Show loading state
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!isAuthenticated || !hasRequiredRole) {
    // Redirect to login page
    window.location.href = '/login';
    return null;
  }

  return <Component {...rest} />;
}

function Router() {
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    // Redirect based on role when accessing dashboard directly
    if (isAuthenticated && user && window.location.pathname === '/dashboard') {
      switch (user.role) {
        case 'guard':
          window.location.href = '/guard/register';
          break;
        case 'host':
          window.location.href = '/host/approve';
          break;
        case 'admin':
          // Admin can stay on the dashboard
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, user]);

  return (
    <Switch>
      {/* Public routes */}
      <Route path="/login" component={Login} />
      
      {/* Admin Routes */}
      <Route path="/dashboard">
        {isAuthenticated && user?.role === 'admin' ? <Dashboard /> : <Login />}
      </Route>
      <Route path="/admin/users">
        {isAuthenticated && user?.role === 'admin' ? <UsersPage /> : <Login />}
      </Route>
      <Route path="/admin/settings">
        {isAuthenticated && user?.role === 'admin' ? <SettingsPage /> : <Login />}
      </Route>
      <Route path="/admin/devices">
        {isAuthenticated && user?.role === 'admin' ? <DevicesPage /> : <Login />}
      </Route>
      <Route path="/admin/reports">
        {isAuthenticated && user?.role === 'admin' ? <ReportsPage /> : <Login />}
      </Route>
      
      {/* Guard Routes */}
      <Route path="/guard/register">
        {isAuthenticated && user?.role === 'guard' ? <RegisterVisitor /> : <Login />}
      </Route>
      <Route path="/guard/visitors">
        {isAuthenticated && user?.role === 'guard' ? <VisitorsList /> : <Login />}
      </Route>
      
      {/* Host Routes */}
      <Route path="/host/approve">
        {isAuthenticated && user?.role === 'host' ? <ApproveVisitors /> : <Login />}
      </Route>
      <Route path="/host/history">
        {isAuthenticated && user?.role === 'host' ? <VisitorHistory /> : <Login />}
      </Route>
      
      <Route path="/" component={Login} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [initialized, setInitialized] = useState(false);
  const { checkAuth } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    const initializeAuth = async () => {
      await checkAuth();
      setInitialized(true);
    };

    initializeAuth();
  }, [checkAuth]);

  if (!initialized) {
    return <div className="flex justify-center items-center h-screen">Initializing...</div>;
  }

  // Just return the router when initialized
  return <Router />;
}

export default App;
