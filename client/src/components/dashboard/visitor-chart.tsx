import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Visitor, VisitorStatus } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// Helper function to group visitors by day
function groupVisitorsByDay(visitors: Visitor[], days = 7) {
  const now = new Date();
  const result = [];
  
  // Initialize days
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    result.push({
      date: date.toISOString().split('T')[0],
      name: new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date),
      checked_in: 0,
      approved: 0,
      rejected: 0
    });
  }
  
  // Count visitors for each day
  visitors.forEach(visitor => {
    const visitDate = new Date(visitor.createdAt).toISOString().split('T')[0];
    const dayIndex = result.findIndex(day => day.date === visitDate);
    
    if (dayIndex >= 0) {
      if (visitor.status === VisitorStatus.CHECKED_IN || visitor.status === VisitorStatus.CHECKED_OUT) {
        result[dayIndex].checked_in += 1;
      } else if (visitor.status === VisitorStatus.APPROVED) {
        result[dayIndex].approved += 1;
      } else if (visitor.status === VisitorStatus.REJECTED) {
        result[dayIndex].rejected += 1;
      }
    }
  });
  
  return result;
}

export function VisitorChart() {
  const { data: visitors, isLoading, error } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle><Skeleton className="h-6 w-48" /></CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !visitors) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Visitor Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md">
            Failed to load visitor data. Please try refreshing the page.
          </div>
        </CardContent>
      </Card>
    );
  }

  const chartData = groupVisitorsByDay(visitors);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Visitor Activity (Last 7 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="checked_in" name="Checked In" fill="#3b82f6" />
              <Bar dataKey="approved" name="Approved" fill="#10b981" />
              <Bar dataKey="rejected" name="Rejected" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
