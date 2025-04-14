import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Visitor, VisitorStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Search, Check, LogOut } from "lucide-react";

export default function VisitorsList() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  const { data: visitors, isLoading } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });
  
  const checkInMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      return await apiRequest("PATCH", `/api/visitors/${visitorId}/status`, {
        status: VisitorStatus.CHECKED_IN
      });
    },
    onSuccess: () => {
      toast({
        title: "Visitor checked in",
        description: "Visitor has been successfully checked in.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to check in visitor",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  const checkOutMutation = useMutation({
    mutationFn: async (visitorId: number) => {
      return await apiRequest("PATCH", `/api/visitors/${visitorId}/status`, {
        status: VisitorStatus.CHECKED_OUT
      });
    },
    onSuccess: () => {
      toast({
        title: "Visitor checked out",
        description: "Visitor has been successfully checked out.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/visitors'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to check out visitor",
        description: (error as Error).message || "Something went wrong.",
      });
    },
  });
  
  // Filter and sort visitors
  const filteredVisitors = visitors
    ? visitors
        .filter(visitor => {
          // Status filter
          if (statusFilter !== "all" && visitor.status !== statusFilter) {
            return false;
          }
          
          // Search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              visitor.name.toLowerCase().includes(searchLower) ||
              visitor.aadharId.toLowerCase().includes(searchLower) ||
              visitor.phone.toLowerCase().includes(searchLower) ||
              (visitor.company && visitor.company.toLowerCase().includes(searchLower)) ||
              visitor.purpose.toLowerCase().includes(searchLower)
            );
          }
          
          return true;
        })
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];
  
  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.APPROVED:
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>;
      case VisitorStatus.REJECTED:
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>;
      case VisitorStatus.PENDING:
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case VisitorStatus.CHECKED_IN:
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Checked In</Badge>;
      case VisitorStatus.CHECKED_OUT:
        return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Checked Out</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Layout title="Visitors List" subtitle="Manage visitor check-ins and check-outs">
      <Card>
        <CardHeader>
          <CardTitle>Visitors</CardTitle>
          <CardDescription>View and manage all visitors in the system</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search visitors..."
                className="pl-8"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value={VisitorStatus.PENDING}>Pending</SelectItem>
                <SelectItem value={VisitorStatus.APPROVED}>Approved</SelectItem>
                <SelectItem value={VisitorStatus.REJECTED}>Rejected</SelectItem>
                <SelectItem value={VisitorStatus.CHECKED_IN}>Checked In</SelectItem>
                <SelectItem value={VisitorStatus.CHECKED_OUT}>Checked Out</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">Loading visitors...</div>
          ) : filteredVisitors.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              No visitors found matching the current filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Visitor</TableHead>
                    <TableHead>ID & Phone</TableHead>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVisitors.map(visitor => (
                    <TableRow key={visitor.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center space-x-3">
                          {visitor.photoUrl && (
                            <img 
                              src={visitor.photoUrl} 
                              alt={visitor.name} 
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          )}
                          <div>
                            {visitor.name}
                            {visitor.company && (
                              <div className="text-xs text-neutral-500">{visitor.company}</div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-neutral-600">ID: {visitor.aadharId}</div>
                        <div className="text-xs text-neutral-600">Ph: {visitor.phone}</div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate" title={visitor.purpose}>
                          {visitor.purpose}
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(visitor.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{getStatusBadge(visitor.status as VisitorStatus)}</TableCell>
                      <TableCell>
                        {visitor.status === VisitorStatus.APPROVED && (
                          <Button 
                            size="sm" 
                            onClick={() => checkInMutation.mutate(visitor.id)}
                            disabled={checkInMutation.isPending}
                            className="bg-blue-600 hover:bg-blue-700"
                          >
                            <Check className="mr-1 h-4 w-4" />
                            Check In
                          </Button>
                        )}
                        
                        {visitor.status === VisitorStatus.CHECKED_IN && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => checkOutMutation.mutate(visitor.id)}
                            disabled={checkOutMutation.isPending}
                          >
                            <LogOut className="mr-1 h-4 w-4" />
                            Check Out
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
