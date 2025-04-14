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
  const { isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Dashboard /> : <Login />}
      </Route>
      
      {/* Dashboard */}
      <Route path="/">
        <PrivateRoute component={Dashboard} />
      </Route>
      
      {/* Guard Routes */}
      <Route path="/guard/register">
        <PrivateRoute role={['guard', 'admin']} component={RegisterVisitor} />
      </Route>
      <Route path="/guard/visitors">
        <PrivateRoute role={['guard', 'admin']} component={VisitorsList} />
      </Route>
      
      {/* Host Routes */}
      <Route path="/host/approve">
        <PrivateRoute role={['host', 'admin']} component={ApproveVisitors} />
      </Route>
      <Route path="/host/history">
        <PrivateRoute role={['host', 'admin']} component={VisitorHistory} />
      </Route>
      
      {/* Admin Routes */}
      <Route path="/admin/users">
        <PrivateRoute role="admin" component={UsersPage} />
      </Route>
      <Route path="/admin/settings">
        <PrivateRoute role="admin" component={SettingsPage} />
      </Route>
      <Route path="/admin/devices">
        <PrivateRoute role="admin" component={DevicesPage} />
      </Route>
      <Route path="/admin/reports">
        <PrivateRoute role="admin" component={ReportsPage} />
      </Route>
      
      {/* Fallback to 404 */}
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
