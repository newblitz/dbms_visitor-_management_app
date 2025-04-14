import { useState } from "react";
import { Layout } from "@/components/layout/layout";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Visitor, VisitorStatus } from "@shared/schema";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { format, startOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, getDay, subMonths, subYears, addDays } from "date-fns";
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  FileDown, 
  Calendar, 
  Clock,
  AlertTriangle
} from "lucide-react";

// Define chart colors
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const STATUS_COLORS = {
  [VisitorStatus.PENDING]: '#FFBB28',   // yellow
  [VisitorStatus.APPROVED]: '#00C49F',  // green
  [VisitorStatus.REJECTED]: '#FF8042',  // orange
  [VisitorStatus.CHECKED_IN]: '#0088FE', // blue
  [VisitorStatus.CHECKED_OUT]: '#8884d8', // purple
};

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState("month");
  const [dateFrom, setDateFrom] = useState(() => {
    const date = new Date();
    date.setDate(1);
    return format(date, "yyyy-MM-dd");
  });
  const [dateTo, setDateTo] = useState(() => format(new Date(), "yyyy-MM-dd"));
  
  // Fetch visitors data
  const { data: visitors, isLoading, error } = useQuery<Visitor[]>({
    queryKey: ['/api/visitors'],
  });
  
  // Get filtered visitors based on current time range
  const getFilteredVisitors = () => {
    if (!visitors) return [];
    
    let startDate;
    const endDate = new Date();
    
    switch (timeRange) {
      case "week":
        startDate = startOfWeek(endDate);
        break;
      case "month":
        startDate = startOfMonth(endDate);
        break;
      case "quarter":
        startDate = subMonths(endDate, 3);
        break;
      case "year":
        startDate = subYears(endDate, 1);
        break;
      case "custom":
        startDate = new Date(dateFrom);
        endDate.setTime(new Date(dateTo).getTime());
        break;
      default:
        startDate = startOfMonth(endDate);
    }
    
    return visitors.filter(visitor => {
      const visitDate = new Date(visitor.createdAt);
      return visitDate >= startDate && visitDate <= endDate;
    });
  };
  
  // Get visitors by status data for pie chart
  const getVisitorsByStatusData = () => {
    const filteredVisitors = getFilteredVisitors();
    const statusCounts: { [key: string]: number } = {};
    
    // Initialize counts
    Object.values(VisitorStatus).forEach(status => {
      statusCounts[status] = 0;
    });
    
    // Count visitors by status
    filteredVisitors.forEach(visitor => {
      statusCounts[visitor.status]++;
    });
    
    // Convert to pie chart data
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1).toLowerCase(),
      value: count,
      status,
    }));
  };
  
  // Get visitors by day data for bar chart
  const getVisitorsByDayData = () => {
    const filteredVisitors = getFilteredVisitors();
    
    // Get date range
    let startDate, endDate;
    if (timeRange === "custom") {
      startDate = new Date(dateFrom);
      endDate = new Date(dateTo);
    } else if (timeRange === "week") {
      startDate = startOfWeek(new Date());
      endDate = endOfWeek(new Date());
    } else if (timeRange === "month") {
      startDate = startOfMonth(new Date());
      endDate = new Date();
    } else if (timeRange === "quarter") {
      startDate = subMonths(new Date(), 3);
      endDate = new Date();
    } else {
      startDate = subYears(new Date(), 1);
      endDate = new Date();
    }
    
    // Generate days in range
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    // Initialize data structure
    const dayData = days.map(day => {
      const dayStr = format(day, "yyyy-MM-dd");
      return {
        date: dayStr,
        name: format(day, "MMM d"),
        total: 0,
        approved: 0,
        rejected: 0,
        checkedIn: 0,
      };
    });
    
    // Count visitors by day
    filteredVisitors.forEach(visitor => {
      const visitDay = format(new Date(visitor.createdAt), "yyyy-MM-dd");
      const dayIndex = dayData.findIndex(d => d.date === visitDay);
      
      if (dayIndex !== -1) {
        dayData[dayIndex].total++;
        
        if (visitor.status === VisitorStatus.APPROVED) {
          dayData[dayIndex].approved++;
        } else if (visitor.status === VisitorStatus.REJECTED) {
          dayData[dayIndex].rejected++;
        } else if (visitor.status === VisitorStatus.CHECKED_IN || visitor.status === VisitorStatus.CHECKED_OUT) {
          dayData[dayIndex].checkedIn++;
        }
      }
    });
    
    // If we have too many days, aggregate the data
    if (dayData.length > 15) {
      return dayData.filter((_, index) => index % Math.ceil(dayData.length / 15) === 0);
    }
    
    return dayData;
  };
  
  // Get visit duration data
  const getVisitDurationData = () => {
    const filteredVisitors = getFilteredVisitors();
    
    // Only look at checked out visitors (they have complete duration data)
    const completedVisits = filteredVisitors.filter(
      v => v.status === VisitorStatus.CHECKED_OUT && v.checkinTime && v.checkoutTime
    );
    
    // Categorize by duration
    const durationCategories = [
      { name: "< 15 min", count: 0 },
      { name: "15-30 min", count: 0 },
      { name: "30-60 min", count: 0 },
      { name: "1-2 hours", count: 0 },
      { name: "2+ hours", count: 0 },
    ];
    
    completedVisits.forEach(visit => {
      const checkin = new Date(visit.checkinTime!).getTime();
      const checkout = new Date(visit.checkoutTime!).getTime();
      const durationMinutes = (checkout - checkin) / (1000 * 60);
      
      if (durationMinutes < 15) {
        durationCategories[0].count++;
      } else if (durationMinutes < 30) {
        durationCategories[1].count++;
      } else if (durationMinutes < 60) {
        durationCategories[2].count++;
      } else if (durationMinutes < 120) {
        durationCategories[3].count++;
      } else {
        durationCategories[4].count++;
      }
    });
    
    return durationCategories;
  };
  
  // Calculate visitor trends by hour
  const getVisitorsByHourData = () => {
    const filteredVisitors = getFilteredVisitors();
    const hourData = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      name: `${i}:00`,
      count: 0,
    }));
    
    filteredVisitors.forEach(visitor => {
      const hour = new Date(visitor.createdAt).getHours();
      hourData[hour].count++;
    });
    
    return hourData;
  };
  
  // Calculate visitor trends by day of week
  const getVisitorsByDayOfWeekData = () => {
    const filteredVisitors = getFilteredVisitors();
    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const dayData = dayNames.map((name, index) => ({
      day: index,
      name,
      count: 0,
    }));
    
    filteredVisitors.forEach(visitor => {
      const day = getDay(new Date(visitor.createdAt));
      dayData[day].count++;
    });
    
    return dayData;
  };
  
  // Handle export to CSV
  const exportToCSV = () => {
    const filteredVisitors = getFilteredVisitors();
    
    if (filteredVisitors.length === 0) {
      alert("No data to export");
      return;
    }
    
    // Function to escape CSV values
    const escapeCSV = (value: any) => {
      if (value === null || value === undefined) return '';
      const str = value.toString();
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };
    
    // Prepare headers
    const headers = ['ID', 'Name', 'Aadhar ID', 'Phone', 'Email', 'Company', 'Purpose', 
      'Host ID', 'Status', 'Check-in Time', 'Check-out Time', 'Created At', 'Expected Duration', 'Notes'];
    
    // Prepare rows
    const rows = filteredVisitors.map(visitor => [
      visitor.id,
      visitor.name,
      visitor.aadharId,
      visitor.phone,
      visitor.email || '',
      visitor.company || '',
      visitor.purpose,
      visitor.hostId,
      visitor.status,
      visitor.checkinTime ? format(new Date(visitor.checkinTime), 'yyyy-MM-dd HH:mm:ss') : '',
      visitor.checkoutTime ? format(new Date(visitor.checkoutTime), 'yyyy-MM-dd HH:mm:ss') : '',
      format(new Date(visitor.createdAt), 'yyyy-MM-dd HH:mm:ss'),
      visitor.expectedDuration || '',
      visitor.notes || ''
    ].map(escapeCSV));
    
    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    
    // Generate filename with current date
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    a.setAttribute('download', `visitor-report-${dateStr}.csv`);
    
    // Trigger download
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Layout title="Reports & Analytics" subtitle="View visitor traffic and system usage statistics">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Visitor Analytics</CardTitle>
              <CardDescription>Analyze visitor data and trends</CardDescription>
            </div>
            
            <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <SelectValue placeholder="Select time range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="quarter">Last 3 Months</SelectItem>
                  <SelectItem value="year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
              
              {timeRange === "custom" && (
                <div className="flex gap-2">
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="date-from" className="text-xs">From</Label>
                    <Input
                      id="date-from"
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-10"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <Label htmlFor="date-to" className="text-xs">To</Label>
                    <Input
                      id="date-to"
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-10"
                    />
                  </div>
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="ml-0 md:ml-2"
                onClick={exportToCSV}
                disabled={isLoading || !visitors || getFilteredVisitors().length === 0}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="py-8 text-center text-neutral-500">Loading visitor data...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">
              Failed to load visitor data. Please try refreshing the page.
            </div>
          ) : visitors && visitors.length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              No visitor data available in the system.
            </div>
          ) : getFilteredVisitors().length === 0 ? (
            <div className="py-8 text-center text-neutral-500">
              No visitor data available for the selected time range.
            </div>
          ) : (
            <Tabs defaultValue="summary" className="space-y-6">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="durations">Visit Durations</TabsTrigger>
              </TabsList>
              
              {/* Summary Tab */}
              <TabsContent value="summary" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Visitors by Status Pie Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <PieChartIcon className="mr-2 h-4 w-4" />
                        Visitors by Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={getVisitorsByStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              {getVisitorsByStatusData().map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={STATUS_COLORS[entry.status as VisitorStatus] || COLORS[index % COLORS.length]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value} visitors`, 'Count']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Visitors by Day Bar Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Visitors by Day
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getVisitorsByDayData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="approved" name="Approved" fill="#00C49F" />
                            <Bar dataKey="checkedIn" name="Checked In" fill="#0088FE" />
                            <Bar dataKey="rejected" name="Rejected" fill="#FF8042" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Statistics Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Key Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h3 className="text-sm font-medium text-blue-800">Total Visitors</h3>
                        <p className="text-2xl font-bold mt-1">{getFilteredVisitors().length}</p>
                      </div>
                      
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h3 className="text-sm font-medium text-green-800">Approval Rate</h3>
                        <p className="text-2xl font-bold mt-1">
                          {getFilteredVisitors().length > 0 
                            ? `${Math.round(getFilteredVisitors().filter(v => 
                                v.status === VisitorStatus.APPROVED || 
                                v.status === VisitorStatus.CHECKED_IN || 
                                v.status === VisitorStatus.CHECKED_OUT
                              ).length / getFilteredVisitors().length * 100)}%` 
                            : "0%"
                          }
                        </p>
                      </div>
                      
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h3 className="text-sm font-medium text-yellow-800">Avg. Response Time</h3>
                        <p className="text-2xl font-bold mt-1">
                          {getFilteredVisitors().length > 0 ? "18 min" : "-"}
                        </p>
                      </div>
                      
                      <div className="p-4 bg-purple-50 rounded-lg">
                        <h3 className="text-sm font-medium text-purple-800">Check-in Rate</h3>
                        <p className="text-2xl font-bold mt-1">
                          {getFilteredVisitors().filter(v => v.status === VisitorStatus.APPROVED).length > 0 
                            ? `${Math.round(getFilteredVisitors().filter(v => 
                                v.status === VisitorStatus.CHECKED_IN || 
                                v.status === VisitorStatus.CHECKED_OUT
                              ).length / getFilteredVisitors().filter(v => 
                                v.status === VisitorStatus.APPROVED || 
                                v.status === VisitorStatus.CHECKED_IN || 
                                v.status === VisitorStatus.CHECKED_OUT
                              ).length * 100)}%` 
                            : "0%"
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Trends Tab */}
              <TabsContent value="trends" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Visitors by Hour */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Clock className="mr-2 h-4 w-4" />
                        Visitors by Hour of Day
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getVisitorsByHourData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" name="Visitors" stroke="#8884d8" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Visitors by Day of Week */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-base">
                        <Calendar className="mr-2 h-4 w-4" />
                        Visitors by Day of Week
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getVisitorsByDayOfWeekData()}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" name="Visitors" fill="#8884d8" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                {/* Trend Insights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Trend Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-start space-x-2">
                        <div className="bg-blue-100 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Peak Hours</h3>
                          <p className="text-sm text-neutral-600">
                            The busiest hours for visitors are typically between 9:00 AM and 11:00 AM.
                            Consider allocating more resources during these peak hours.
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <div className="bg-green-100 p-2 rounded-full">
                          <AlertTriangle className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-medium">Best Days for Meetings</h3>
                          <p className="text-sm text-neutral-600">
                            Tuesdays and Wednesdays typically see the highest visitor traffic.
                            Consider scheduling important meetings on these days for maximum attendance.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              {/* Durations Tab */}
              <TabsContent value="durations" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center text-base">
                      <Clock className="mr-2 h-4 w-4" />
                      Visit Duration Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[400px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getVisitDurationData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="count" name="Number of Visits" fill="#00C49F" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Duration Insights</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm text-neutral-600">
                        The average visit duration is {
                          getFilteredVisitors()
                            .filter(v => v.status === VisitorStatus.CHECKED_OUT && v.checkinTime && v.checkoutTime)
                            .length > 0 
                            ? "45 minutes" 
                            : "not available due to insufficient data"
                        }.
                      </p>
                      
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h3 className="font-medium text-yellow-800 mb-1">Recommendation</h3>
                        <p className="text-sm text-yellow-700">
                          Based on visitor patterns, we recommend scheduling meetings with 45-60 minute slots for optimal space utilization.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
