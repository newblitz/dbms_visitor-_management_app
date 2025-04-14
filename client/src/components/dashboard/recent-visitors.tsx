import { useQuery } from "@tanstack/react-query";
import { Visitor, VisitorStatus } from "@shared/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

// Helper to get badge variant based on visitor status
function getStatusBadge(status: VisitorStatus) {
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
}

export function RecentVisitors() {
  const { data: visitors, isLoading, error } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <Skeleton className="h-6 w-48" />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4].map(i => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  if (error || !visitors) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
        Failed to load visitors. Please try refreshing the page.
      </div>
    );
  }

  // Sort visitors by created time (most recent first)
  const sortedVisitors = [...visitors]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5); // Show only the 5 most recent

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold text-neutral-900">Recent Visitors</h2>
      </div>
      
      {sortedVisitors.length > 0 ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Visitor</TableHead>
                <TableHead>Purpose</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVisitors.map(visitor => (
                <TableRow key={visitor.id}>
                  <TableCell className="font-medium">{visitor.name}</TableCell>
                  <TableCell>{visitor.purpose}</TableCell>
                  <TableCell>{formatDistanceToNow(new Date(visitor.createdAt), { addSuffix: true })}</TableCell>
                  <TableCell>{getStatusBadge(visitor.status as VisitorStatus)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="p-8 text-center text-neutral-500">
          No visitors registered yet.
        </div>
      )}
    </div>
  );
}
