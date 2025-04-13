import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/hooks/use-auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisitorForm } from "@/components/visitor/visitor-form";
import { VisitorList } from "@/components/visitor/visitor-list";
import { VisitorDetails } from "@/components/visitor/visitor-details";
import { useQuery } from "@tanstack/react-query";
import { useSocketEvent } from "@/lib/socket";
import { useToast } from "@/hooks/use-toast";
import { VisitorStatus } from "@shared/schema";

export default function Guard() {
  const { user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("visitors");
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const { toast } = useToast();
  
  // Fetch all visitors
  const { 
    data: visitors = [], 
    refetch: refetchVisitors 
  } = useQuery({
    queryKey: ["/api/visitors"],
    enabled: !!user,
  });
  
  // Socket event listeners for real-time updates
  useSocketEvent('visitor-status-updated', (updatedVisitor) => {
    refetchVisitors();
    
    toast({
      title: "Visitor Status Updated",
      description: `${updatedVisitor.name}'s status changed to ${updatedVisitor.status.replace('_', ' ')}`,
      duration: 5000,
    });
    
    // Update selected visitor if it's the one being updated
    if (selectedVisitor && selectedVisitor.id === updatedVisitor.id) {
      setSelectedVisitor(updatedVisitor);
    }
  });
  
  // Filter visitors based on status
  const pendingVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.PENDING
  );
  
  const approvedVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.APPROVED
  );
  
  const checkedInVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.CHECKED_IN
  );
  
  const rejectedVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.REJECTED
  );
  
  const checkedOutVisitors = visitors.filter((visitor: any) => 
    visitor.status === VisitorStatus.CHECKED_OUT
  );
  
  // Handle visitor registration success
  const handleRegistrationSuccess = () => {
    refetchVisitors();
    setActiveTab("visitors");
  };
  
  // Handle visitor selection for details view
  const handleVisitorSelect = (visitor: any) => {
    setSelectedVisitor(visitor);
  };
  
  // Handle back button in details view
  const handleBackToList = () => {
    setSelectedVisitor(null);
  };
  
  // Handle check-in
  const handleCheckIn = async (visitorId: number) => {
    try {
      const response = await fetch(`/api/visitors/${visitorId}/checkin`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check in visitor');
      }
      
      const updatedVisitor = await response.json();
      
      // Update the selected visitor
      if (selectedVisitor && selectedVisitor.id === visitorId) {
        setSelectedVisitor(updatedVisitor);
      }
      
      refetchVisitors();
      
      toast({
        title: "Visitor Checked In",
        description: `${updatedVisitor.name} has been successfully checked in`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Check-in Failed",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
        duration: 5000,
      });
    }
  };
  
  // Handle check-out
  const handleCheckOut = async (visitorId: number) => {
    try {
      const response = await fetch(`/api/visitors/${visitorId}/checkout`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to check out visitor');
      }
      
      const updatedVisitor = await response.json();
      
      // Update the selected visitor
      if (selectedVisitor && selectedVisitor.id === visitorId) {
        setSelectedVisitor(updatedVisitor);
      }
      
      refetchVisitors();
      
      toast({
        title: "Visitor Checked Out",
        description: `${updatedVisitor.name} has been successfully checked out`,
        duration: 5000,
      });
    } catch (error) {
      toast({
        title: "Check-out Failed",
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
              <h1 className="text-xl font-bold">Guard Portal</h1>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {/* Render visitor details if a visitor is selected */}
          {selectedVisitor ? (
            <VisitorDetails 
              visitor={selectedVisitor} 
              onBack={handleBackToList}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="visitors">Manage Visitors</TabsTrigger>
                <TabsTrigger value="register">Register New Visitor</TabsTrigger>
              </TabsList>
              
              <TabsContent value="visitors" className="mt-4">
                <Tabs defaultValue="approved">
                  <TabsList className="mb-4">
                    <TabsTrigger value="approved">
                      Approved ({approvedVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="pending">
                      Pending ({pendingVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="checkedin">
                      Checked In ({checkedInVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="checkedout">
                      Checked Out ({checkedOutVisitors.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      Rejected ({rejectedVisitors.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="approved">
                    <VisitorList 
                      visitors={approvedVisitors} 
                      onSelect={handleVisitorSelect}
                      showCheckInButton
                      onCheckIn={handleCheckIn}
                    />
                  </TabsContent>
                  
                  <TabsContent value="pending">
                    <VisitorList 
                      visitors={pendingVisitors} 
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="checkedin">
                    <VisitorList 
                      visitors={checkedInVisitors} 
                      onSelect={handleVisitorSelect}
                      showCheckOutButton
                      onCheckOut={handleCheckOut}
                    />
                  </TabsContent>
                  
                  <TabsContent value="checkedout">
                    <VisitorList 
                      visitors={checkedOutVisitors} 
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                  
                  <TabsContent value="rejected">
                    <VisitorList 
                      visitors={rejectedVisitors} 
                      onSelect={handleVisitorSelect}
                    />
                  </TabsContent>
                </Tabs>
              </TabsContent>
              
              <TabsContent value="register" className="mt-4">
                <VisitorForm 
                  guardId={user?.id || 0}
                  onSuccess={handleRegistrationSuccess}
                />
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </div>
  );
}
