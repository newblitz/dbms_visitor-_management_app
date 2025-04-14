import { Layout } from "@/components/layout/layout";
import { VisitorStats } from "@/components/dashboard/visitor-stats";
import { VisitorChart } from "@/components/dashboard/visitor-chart";
import { RecentVisitors } from "@/components/dashboard/recent-visitors";
import { useAuth } from "@/lib/auth";

export default function Dashboard() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const getRoleSpecificWelcome = () => {
    switch (user.role) {
      case "admin":
        return "Here's your admin dashboard overview.";
      case "guard":
        return "Monitor visitor check-ins and registrations.";
      case "host":
        return "Manage your visitor approvals and history.";
      default:
        return "Welcome to the Visitor Management System.";
    }
  };
  
  return (
    <Layout title="Dashboard" subtitle={getRoleSpecificWelcome()}>
      {/* Stats Overview */}
      <VisitorStats />
      
      {/* Charts and Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <VisitorChart />
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-2">
              {user.role === "guard" && (
                <>
                  <a href="/guard/register" className="block p-2 bg-primary-50 hover:bg-primary-100 rounded text-primary-700">
                    Register New Visitor
                  </a>
                  <a href="/guard/visitors" className="block p-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-700">
                    Check-in/Checkout Visitors
                  </a>
                </>
              )}
              
              {user.role === "host" && (
                <>
                  <a href="/host/approve" className="block p-2 bg-primary-50 hover:bg-primary-100 rounded text-primary-700">
                    Approve Pending Visitors
                  </a>
                  <a href="/host/history" className="block p-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-700">
                    View Visitor History
                  </a>
                </>
              )}
              
              {user.role === "admin" && (
                <>
                  <a href="/admin/users" className="block p-2 bg-primary-50 hover:bg-primary-100 rounded text-primary-700">
                    Manage Users
                  </a>
                  <a href="/admin/devices" className="block p-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-700">
                    Manage IoT Devices
                  </a>
                  <a href="/admin/reports" className="block p-2 bg-neutral-50 hover:bg-neutral-100 rounded text-neutral-700">
                    View Reports
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Visitors */}
      <div className="mt-6">
        <RecentVisitors />
      </div>
    </Layout>
  );
}
