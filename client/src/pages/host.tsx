import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { ApprovalList } from "@/components/host/approval-list";
import { VisitorList } from "@/components/visitor/visitor-list";
import { VisitorDetails } from "@/components/visitor/visitor-details";
import { VisitorStatus } from "@shared/schema";
import { useHostChannel, useSocketEvent } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, Bell, CheckCircle, Clock, UserCheck, XCircle } from "lucide-react";

export default function Host() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Join host-specific socket channel
  useHostChannel(user?.id || null);
  
  // Fetch visitors for this host
  const { 
    data: visitors = [], 
    refetch: refetchVisitors,
    isLoading 
  } = useQuery({
    queryKey: [`/api/visitors/host/${user?.id}`],
    enabled: !!user,
  });
  
  // Listen for new visitor notifications
  useSocketEvent('new-visitor', (visitor) => {
    refetchVisitors();
    
    toast({
      title: "New Visitor Request",
      description: `${visitor.name} is waiting for your approval`,
      duration: 5000,
    });
  });
  
  // Filter visitors based on status
  const pendingVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.PENDING
  );
  
  const approvedVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.APPROVED || visitor.status === VisitorStatus.CHECKED_IN
  );
  
  const rejectedVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.REJECTED
  );
  
  const checkedOutVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.CHECKED_OUT
  );
  
  // Handle visitor selection for details view
  const handleVisitorSelect = (visitor: any) => {
    setSelectedVisitor(visitor);
  };
  
  // Handle back button in details view
  const handleBackToList = () => {
    setSelectedVisitor(null);
  };
  
  // Handle approval/rejection
  const handleStatusChange = async (visitorId: number, status: string, comments: string = "") => {
    try {
      const response = await fetch(`/api/visitors/${visitorId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, comments }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update visitor status');
      }
      
      const updatedVisitor = await response.json();
      
      // Update the selected visitor if it's the one being updated
      if (selectedVisitor && selectedVisitor.id === visitorId) {
        setSelectedVisitor(updatedVisitor);
      }
      
      refetchVisitors();
      
      toast({
        title: status === VisitorStatus.APPROVED ? "Visitor Approved" : "Visitor Rejected",
        description: `${updatedVisitor.name}'s visit has been ${status === VisitorStatus.APPROVED ? 'approved' : 'rejected'}`,
        duration: 5000,
      });
      
      if (selectedVisitor) {
        handleBackToList();
      }
    } catch (error) {
      toast({
        title: "Status Update Failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
        duration: 5000,
      });
    }
  };

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
              <h1 className="text-xl font-bold">Host Portal</h1>
            </div>
            
            {pendingVisitors.length > 0 && (
              <div className="flex items-center">
                <span className="relative inline-flex">
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-0 right-0 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                </span>
                <span className="ml-2 text-sm font-medium">
                  {pendingVisitors.length} pending approval{pendingVisitors.length !== 1 && 's'}
                </span>
              </div>
            )}
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Stats Cards */}
          {!selectedVisitor && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Pending Approval</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                    <span className="text-2xl font-bold">{pendingVisitors.length}</span>
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
                    <span className="text-2xl font-bold">{approvedVisitors.length}</span>
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
                    <span className="text-2xl font-bold">{rejectedVisitors.length}</span>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Completed Visits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 mr-2 text-blue-500" />
                    <span className="text-2xl font-bold">{checkedOutVisitors.length}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          
          {/* Main Content */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : selectedVisitor ? (
            <VisitorDetails 
              visitor={selectedVisitor} 
              onBack={handleBackToList}
              onApprove={(id) => handleStatusChange(id, VisitorStatus.APPROVED)}
              onReject={(id, comments) => handleStatusChange(id, VisitorStatus.REJECTED, comments)}
              showApproveReject={selectedVisitor.status === VisitorStatus.PENDING}
            />
          ) : (
            <>
              {pendingVisitors.length > 0 ? (
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="pending">
                      Pending ({pendingVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="approved">
                      Approved ({approvedVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({rejectedVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="completed">
                      Completed ({checkedOutVisitors.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="pending" className="mt-4">
                    <ApprovalList 
                      visitors={pendingVisitors}
                      onSelect={handleVisitorSelect}
                      onApprove={(id) => handleStatusChange(id, VisitorStatus.APPROVED)}
                      onReject={(id, comments) => handleStatusChange(id, VisitorStatus.REJECTED, comments)}
                    />
                  </TabsContent>
                  
                  <TabsContent value="approved" className="mt-4">
                    <VisitorList 
                      visitors={approvedVisitors}
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="rejected" className="mt-4">
                    <VisitorList 
                      visitors={rejectedVisitors}
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="completed" className="mt-4">
                    <VisitorList 
                      visitors={checkedOutVisitors}
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                </Tabs>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>No Pending Visitors</CardTitle>
                    <CardDescription>
                      You don't have any visitors waiting for approval
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-center py-6">
                    <div className="text-center">
                      <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        When someone requests to visit you, they'll appear here for your approval
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
