import { useQuery } from "@tanstack/react-query";
import { StatsCard } from "./stats-card";
import { Users, Clock, ClipboardCheck, Timer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StatsData {
  totalVisitors: number;
  checkedInToday: number;
  pendingApproval: number;
  averageDuration: number;
}

export function VisitorStats() {
  const { data, isLoading, error } = useQuery<StatsData>({
    queryKey: ['/api/stats'],
  });

  if (isLoading) {
    return (
      <div className="stats-grid">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-8 w-16 mb-4" />
            <Skeleton className="h-4 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
        Failed to load statistics. Please try refreshing the page.
      </div>
    );
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="stats-grid">
      <StatsCard
        title="Total Visitors"
        value={data.totalVisitors}
        icon={<Users className="h-5 w-5" />}
      />
      
      <StatsCard
        title="Checked In Today"
        value={data.checkedInToday}
        icon={<Clock className="h-5 w-5" />}
      />
      
      <StatsCard
        title="Pending Approval"
        value={data.pendingApproval}
        icon={<ClipboardCheck className="h-5 w-5" />}
        changeType={data.pendingApproval > 3 ? "increase" : "neutral"}
        changeText={data.pendingApproval > 0 ? "requires attention" : "all clear"}
      />
      
      <StatsCard
        title="Avg. Visit Duration"
        value={formatDuration(data.averageDuration)}
        icon={<Timer className="h-5 w-5" />}
      />
    </div>
  );
}
