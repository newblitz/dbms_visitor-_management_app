import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { UserRoles, VisitorStatus } from "@shared/schema";
import { 
  UserCheck, 
  Users, 
  Box, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowLeft,
  ArrowRight
} from "lucide-react";
import UsersManagement from "@/components/admin/users-management";
import DevicesManagement from "@/components/admin/devices-management";
import { useLocation } from "wouter";

export default function Admin() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  
  // Parse the tab from the URL
  const params = new URLSearchParams(location.split("?")[1] || "");
  const tabFromUrl = params.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromUrl || "dashboard");
  
  // Fetch all visitors for statistics
  const { data: visitors = [] } = useQuery({
    queryKey: ["/api/visitors"],
    enabled: !!user,
  });
  
  // Fetch all users for statistics
  const { data: users = [] } = useQuery({
    queryKey: ["/api/users"],
    enabled: !!user,
  });
  
  // Fetch all devices for statistics
  const { data: devices = [] } = useQuery({
    queryKey: ["/api/devices"],
    enabled: !!user,
  });
  
  // Calculate statistics
  const pendingCount = visitors.filter((v: any) => v.status === VisitorStatus.PENDING).length;
  const approvedCount = visitors.filter((v: any) => v.status === VisitorStatus.APPROVED).length;
  const rejectedCount = visitors.filter((v: any) => v.status === VisitorStatus.REJECTED).length;
  const checkedInCount = visitors.filter((v: any) => v.status === VisitorStatus.CHECKED_IN).length;
  const checkedOutCount = visitors.filter((v: any) => v.status === VisitorStatus.CHECKED_OUT).length;
  
  const adminCount = users.filter((u: any) => u.role === UserRoles.ADMIN).length;
  const guardCount = users.filter((u: any) => u.role === UserRoles.GUARD).length;
  const hostCount = users.filter((u: any) => u.role === UserRoles.HOST).length;
  
  const activeDevices = devices.filter((d: any) => d.active).length;

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
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="users">Users Management</TabsTrigger>
              <TabsTrigger value="devices">IoT Devices</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-4">System Overview</h2>
                
                {/* Users Statistics */}
                <h3 className="text-lg font-medium mb-2">Users</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Admins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-2xl font-bold">{adminCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Guards</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-green-500" />
                        <span className="text-2xl font-bold">{guardCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Hosts</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-500" />
                        <span className="text-2xl font-bold">{hostCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Visitor Statistics */}
                <h3 className="text-lg font-medium mb-2">Visitors</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                        <span className="text-2xl font-bold">{pendingCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                        <span className="text-2xl font-bold">{approvedCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Rejected</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 mr-2 text-red-500" />
                        <span className="text-2xl font-bold">{rejectedCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Checked In</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <ArrowRight className="h-5 w-5 mr-2 text-blue-500" />
                        <span className="text-2xl font-bold">{checkedInCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Checked Out</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <ArrowLeft className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="text-2xl font-bold">{checkedOutCount}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Devices Statistics */}
                <h3 className="text-lg font-medium mb-2">IoT Devices</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Devices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Box className="h-5 w-5 mr-2 text-gray-500" />
                        <span className="text-2xl font-bold">{devices.length}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active Devices</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <Box className="h-5 w-5 mr-2 text-green-500" />
                        <span className="text-2xl font-bold">{activeDevices}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Recent Activity - Placeholder for now */}
                <h3 className="text-lg font-medium mb-2">Recent Activity</h3>
                <Card>
                  <CardHeader>
                    <CardTitle>Access Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative h-[300px] w-full flex items-center justify-center">
                      <div className="text-center text-muted-foreground">
                        <p>Recent access logs will be displayed here</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="users">
              <UsersManagement />
            </TabsContent>
            
            <TabsContent value="devices">
              <DevicesManagement />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
