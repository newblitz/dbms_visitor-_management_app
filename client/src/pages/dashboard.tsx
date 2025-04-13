import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { UserRoles, VisitorStatus } from "@shared/schema";
import { 
  BarChart, 
  PieChart,
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft, 
  ArrowRight,
  UserCheck,
  Users,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Bell
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { useSocketEvent, useUserChannel } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const { toast } = useToast();
  
  useUserChannel(user?.id || null);
  
  // Listen for new notifications
  useSocketEvent('new-notification', (data: any) => {
    setNotifications(prev => [data, ...prev]);
    toast({
      title: data.title,
      description: data.message,
      duration: 5000,
    });
  });
  
  // Fetch notifications for the current user
  const { data: fetchedNotifications } = useQuery({
    queryKey: [`/api/notifications/${user?.id}`],
    enabled: !!user,
  });
  
  useEffect(() => {
    if (fetchedNotifications) {
      setNotifications(fetchedNotifications);
    }
  }, [fetchedNotifications]);
  
  // Mark notification as read
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
      });
      
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === id ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };
  
  // Get unread notifications count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Fetch visitors statistics based on user role
  const { data: visitors = [] } = useQuery({
    queryKey: [user?.role === UserRoles.HOST ? `/api/visitors/host/${user?.id}` : "/api/visitors"],
    enabled: !!user,
  });
  
  // Calculate visitor statistics
  const pendingCount = visitors.filter((v: any) => v.status === VisitorStatus.PENDING).length;
  const approvedCount = visitors.filter((v: any) => v.status === VisitorStatus.APPROVED).length;
  const rejectedCount = visitors.filter((v: any) => v.status === VisitorStatus.REJECTED).length;
  const checkedInCount = visitors.filter((v: any) => v.status === VisitorStatus.CHECKED_IN).length;
  const checkedOutCount = visitors.filter((v: any) => v.status === VisitorStatus.CHECKED_OUT).length;
  
  // Fetch today's visitors
  const { data: todayVisitors = [] } = useQuery({
    queryKey: ["/api/visitors/today"],
    enabled: !!user,
  });

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Sidebar Toggle */}
      <div className="md:hidden">
        <div className="fixed inset-0 bg-black/50 z-40" hidden={!mobileMenuOpen} onClick={() => setMobileMenuOpen(false)} />
        <div className={`fixed inset-y-0 z-50 ${mobileMenuOpen ? 'left-0' : '-left-full'} transition-transform duration-300`}>
          <Sidebar isMobile onClose={() => setMobileMenuOpen(false)} />
        </div>
      </div>
      
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation Bar */}
        <header className="border-b bg-card">
          <div className="flex h-16 items-center px-4 justify-between">
            <div className="flex items-center">
              <button 
                className="md:hidden mr-2"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <h1 className="text-xl font-bold">Dashboard</h1>
            </div>
            
            <div className="flex items-center">
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={() => setShowNotifications(!showNotifications)}
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-card rounded-md shadow-lg overflow-hidden z-50">
                    <div className="p-3 border-b">
                      <h3 className="font-medium">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div 
                            key={notification.id} 
                            className={`p-3 border-b hover:bg-muted cursor-pointer ${!notification.read ? 'bg-blue-50' : ''}`}
                            onClick={() => markAsRead(notification.id)}
                          >
                            <div className="flex justify-between">
                              <h4 className="font-medium text-sm">{notification.title}</h4>
                              <span className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                            <p className="text-sm mt-1">{notification.message}</p>
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-2 border-t text-center">
                        <button className="text-sm text-primary hover:underline">
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Welcome Section */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-2">Welcome, {user?.name}</h2>
            <p className="text-muted-foreground">
              {user?.role === UserRoles.ADMIN 
                ? "Manage your visitor management system" 
                : user?.role === UserRoles.GUARD 
                  ? "Register and verify visitors" 
                  : "Approve or reject visitor requests"}
            </p>
          </div>
          
          {/* Statistics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                  <span className="text-2xl font-bold">{pendingCount}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" asChild className="p-0">
                  <Link to={user?.role === UserRoles.HOST ? "/host" : "/guard"}>
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Approved Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                  <span className="text-2xl font-bold">{approvedCount}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" asChild className="p-0">
                  <Link to={user?.role === UserRoles.HOST ? "/host" : "/guard"}>
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejected Visitors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <XCircle className="h-5 w-5 mr-2 text-red-500" />
                  <span className="text-2xl font-bold">{rejectedCount}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" asChild className="p-0">
                  <Link to={user?.role === UserRoles.HOST ? "/host" : "/guard"}>
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Currently Checked In</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                  <span className="text-2xl font-bold">{checkedInCount}</span>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="link" size="sm" asChild className="p-0">
                  <Link to="/guard">
                    View all <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {/* Quick Access Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {user?.role === UserRoles.GUARD || user?.role === UserRoles.ADMIN ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Register New Visitor</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Register a new visitor and capture their information
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link to="/guard">Go to Guard Portal</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : null}
            
            {user?.role === UserRoles.HOST || user?.role === UserRoles.ADMIN ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pending Approvals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {pendingCount} visitor{pendingCount !== 1 ? 's' : ''} waiting for your approval
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link to="/host">Go to Host Portal</Link>
                  </Button>
                </CardFooter>
              </Card>
            ) : null}
            
            {user?.role === UserRoles.ADMIN && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">System Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Manage users, configure IoT devices, and system settings
                  </p>
                </CardContent>
                <CardFooter>
                  <Button asChild>
                    <Link to="/admin">Go to Admin Portal</Link>
                  </Button>
                </CardFooter>
              </Card>
            )}
          </div>
          
          {/* Recent Visitors Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Today's Visitors</h3>
            <div className="bg-card border rounded-md overflow-hidden">
              {todayVisitors.length === 0 ? (
                <div className="p-6 text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p>No visitors for today</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted">
                        <th className="px-4 py-2 text-left font-medium">Name</th>
                        <th className="px-4 py-2 text-left font-medium">Purpose</th>
                        <th className="px-4 py-2 text-left font-medium">Host</th>
                        <th className="px-4 py-2 text-left font-medium">Status</th>
                        <th className="px-4 py-2 text-left font-medium">Check In</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todayVisitors.slice(0, 5).map((visitor: any) => (
                        <tr key={visitor.id} className="border-t">
                          <td className="px-4 py-3">{visitor.name}</td>
                          <td className="px-4 py-3">{visitor.purpose}</td>
                          <td className="px-4 py-3">Host #{visitor.hostId}</td>
                          <td className="px-4 py-3">
                            <Badge 
                              variant={
                                visitor.status === VisitorStatus.PENDING 
                                  ? "outline" 
                                  : visitor.status === VisitorStatus.APPROVED 
                                  ? "secondary" 
                                  : visitor.status === VisitorStatus.REJECTED 
                                  ? "destructive" 
                                  : visitor.status === VisitorStatus.CHECKED_IN 
                                  ? "default" 
                                  : "outline"
                              }
                            >
                              {visitor.status.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            {visitor.checkInTime 
                              ? new Date(visitor.checkInTime).toLocaleTimeString() 
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {todayVisitors.length > 5 && (
                <div className="p-2 border-t text-center">
                  <Button variant="link" size="sm" asChild>
                    <Link to="/guard">View all visitors</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          {/* Dashboard footer with placeholder charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Visitor Traffic</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <BarChart className="h-20 w-20 mb-2 mx-auto" />
                  <p>Visitor traffic chart will be displayed here</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Visitor Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-80 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <PieChart className="h-20 w-20 mb-2 mx-auto" />
                  <p>Visitor breakdown by purpose will be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
