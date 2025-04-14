import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format, formatDistanceToNow } from "date-fns";
import { Search, Calendar, Clock, ExternalLink, Info } from "lucide-react";

export default function VisitorHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [selectedVisitor, setSelectedVisitor] = useState<Visitor | null>(null);
  
  const { data: visitors, isLoading } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to fetch visitors",
        description: (error as Error).message || "Something went wrong. Please try again.",
      });
    },
  });
  
  // Filter visitors based on search, status, and date
  const filteredVisitors = visitors
    ? visitors
        .filter(visitor => {
          // Status filter
          if (statusFilter !== "all" && visitor.status !== statusFilter) {
            return false;
          }
          
          // Date filter
          if (dateFilter !== "all") {
            const visitDate = new Date(visitor.createdAt);
            const now = new Date();
            
            if (dateFilter === "today") {
              const todayStart = new Date(now.setHours(0, 0, 0, 0));
              if (visitDate < todayStart) return false;
            } else if (dateFilter === "week") {
              const weekStart = new Date(now.setDate(now.getDate() - 7));
              if (visitDate < weekStart) return false;
            } else if (dateFilter === "month") {
              const monthStart = new Date(now.setMonth(now.getMonth() - 1));
              if (visitDate < monthStart) return false;
            }
          }
          
          // Search filter
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
              visitor.name.toLowerCase().includes(searchLower) ||
              visitor.purpose.toLowerCase().includes(searchLower) ||
              (visitor.company && visitor.company.toLowerCase().includes(searchLower))
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
  
  // Calculate visit duration for checked out visitors
  const getVisitDuration = (visitor: Visitor) => {
    if (visitor.checkinTime && visitor.checkoutTime) {
      const checkin = new Date(visitor.checkinTime).getTime();
      const checkout = new Date(visitor.checkoutTime).getTime();
      const durationMinutes = Math.round((checkout - checkin) / (1000 * 60));
      
      if (durationMinutes < 60) {
        return `${durationMinutes} min`;
      } else {
        const hours = Math.floor(durationMinutes / 60);
        const minutes = durationMinutes % 60;
        return `${hours}h ${minutes}m`;
      }
    }
    return "-";
  };

  return (
    <Layout title="Visitor History" subtitle="View your past and upcoming visitors">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Visitors History</CardTitle>
          <CardDescription>Track all the visitors you've had or will have</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by name, purpose, company..."
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
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Filter by date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">Loading visitor history...</div>
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
                    <TableHead>Purpose</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Details</TableHead>
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
                        <div className="max-w-[200px] truncate" title={visitor.purpose}>
                          {visitor.purpose}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            {format(new Date(visitor.createdAt), "MMM d, yyyy")}
                          </div>
                          <div className="flex items-center text-xs text-neutral-500 mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(visitor.createdAt), "h:mm a")}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(visitor.status as VisitorStatus)}</TableCell>
                      <TableCell>{getVisitDuration(visitor)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => setSelectedVisitor(visitor)}
                        >
                          <Info className="h-4 w-4" />
                          <span className="sr-only">View details</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Visitor Details Dialog */}
      <Dialog open={!!selectedVisitor} onOpenChange={() => setSelectedVisitor(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Visitor Details</DialogTitle>
            <DialogDescription>
              Complete information about this visitor
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisitor && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
              <div className="md:col-span-1">
                {selectedVisitor.photoUrl ? (
                  <img 
                    src={selectedVisitor.photoUrl} 
                    alt={selectedVisitor.name} 
                    className="w-full rounded-md object-cover aspect-square"
                  />
                ) : (
                  <div className="bg-neutral-100 rounded w-full aspect-square flex items-center justify-center text-neutral-400">
                    No photo
                  </div>
                )}
                
                <div className="mt-4">
                  <h3 className="text-lg font-semibold">{selectedVisitor.name}</h3>
                  {selectedVisitor.company && (
                    <p className="text-neutral-500">{selectedVisitor.company}</p>
                  )}
                </div>
                
                <div className="mt-4 space-y-2">
                  <div>
                    <span className="text-xs text-neutral-500">Status:</span>
                    <div className="mt-1">
                      {getStatusBadge(selectedVisitor.status as VisitorStatus)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2 space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-neutral-500">Purpose of Visit</h3>
                  <p className="mt-1">{selectedVisitor.purpose}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Phone</h3>
                    <p className="mt-1">{selectedVisitor.phone}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Email</h3>
                    <p className="mt-1">{selectedVisitor.email || "-"}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Aadhar ID</h3>
                    <p className="mt-1">{selectedVisitor.aadharId}</p>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Expected Duration</h3>
                    <p className="mt-1">{selectedVisitor.expectedDuration} min</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-neutral-200">
                  <div>
                    <h3 className="text-sm font-medium text-neutral-500">Registration Time</h3>
                    <p className="mt-1">{format(new Date(selectedVisitor.createdAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                  
                  {selectedVisitor.checkinTime && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Check-in Time</h3>
                      <p className="mt-1">{format(new Date(selectedVisitor.checkinTime), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                  
                  {selectedVisitor.checkoutTime && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Check-out Time</h3>
                      <p className="mt-1">{format(new Date(selectedVisitor.checkoutTime), "MMM d, yyyy h:mm a")}</p>
                    </div>
                  )}
                  
                  {selectedVisitor.checkinTime && selectedVisitor.checkoutTime && (
                    <div>
                      <h3 className="text-sm font-medium text-neutral-500">Actual Duration</h3>
                      <p className="mt-1">{getVisitDuration(selectedVisitor)}</p>
                    </div>
                  )}
                </div>
                
                {selectedVisitor.notes && (
                  <div className="pt-2 border-t border-neutral-200">
                    <h3 className="text-sm font-medium text-neutral-500">Notes</h3>
                    <p className="mt-1 text-sm">{selectedVisitor.notes}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
