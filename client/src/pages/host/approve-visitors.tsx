import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Visitor, VisitorStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { ApprovalCard } from "@/components/forms/approval-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Clock } from "lucide-react";

export default function ApproveVisitors() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("pending");
  
  const { data: pendingVisitors, isLoading: isLoadingPending } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors/pending'],
  });
  
  const { data: allVisitors, isLoading: isLoadingAll } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });
  
  const approveMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest("PATCH", `/api/visitors/${id}/status`, {
        status: VisitorStatus.APPROVED,
        notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Visitor approved",
        description: "The visitor has been approved and will be notified.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to approve visitor",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  const rejectMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: number; notes: string }) => {
      return await apiRequest("PATCH", `/api/visitors/${id}/status`, {
        status: VisitorStatus.REJECTED,
        notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Visitor rejected",
        description: "The visitor has been rejected.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors/pending'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to reject visitor",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  const handleApprove = (id: number, notes: string) => {
    approveMutation.mutate({ id, notes });
  };
  
  const handleReject = (id: number, notes: string) => {
    rejectMutation.mutate({ id, notes });
  };
  
  const isProcessing = approveMutation.isPending || rejectMutation.isPending;
  
  // Filter for recent visitors (approved or rejected in last 24h)
  const recentVisitors = allVisitors
    ? allVisitors
        .filter(visitor => 
          (visitor.status === VisitorStatus.APPROVED || visitor.status === VisitorStatus.REJECTED) &&
          new Date(visitor.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
        )
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  return (
    <Layout title="Visitor Approval" subtitle="Review and approve visitor requests">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending Approval
            {pendingVisitors && pendingVisitors.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                {pendingVisitors.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="recent">Recent Decisions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          {isLoadingPending ? (
            <Card>
              <CardContent className="flex justify-center items-center py-10">
                <div className="flex items-center">
                  <Clock className="animate-spin h-5 w-5 mr-2 text-primary" />
                  <p>Loading pending visitors...</p>
                </div>
              </CardContent>
            </Card>
          ) : pendingVisitors && pendingVisitors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingVisitors.map(visitor => (
                <ApprovalCard
                  key={visitor.id}
                  visitor={visitor}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-green-50 rounded-full p-3 mb-4">
                  <AlertCircle className="h-8 w-8 text-green-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">No pending visitors</h3>
                <p className="text-neutral-500 text-center max-w-md">
                  You don't have any visitors waiting for approval at the moment. When someone registers to visit you, they'll appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent">
          {isLoadingAll ? (
            <Card>
              <CardContent className="flex justify-center items-center py-10">
                <div className="flex items-center">
                  <Clock className="animate-spin h-5 w-5 mr-2 text-primary" />
                  <p>Loading recent decisions...</p>
                </div>
              </CardContent>
            </Card>
          ) : recentVisitors.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recentVisitors.map(visitor => (
                <ApprovalCard
                  key={visitor.id}
                  visitor={visitor}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={isProcessing}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="bg-blue-50 rounded-full p-3 mb-4">
                  <AlertCircle className="h-8 w-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-medium mb-2">No recent decisions</h3>
                <p className="text-neutral-500 text-center max-w-md">
                  You haven't approved or rejected any visitors in the last 24 hours.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </Layout>
  );
}
