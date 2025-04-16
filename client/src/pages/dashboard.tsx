import { UserRole } from "@shared/schema";

export default function Dashboard() {
  // For now, we'll create a simplified dashboard without all the component dependencies
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Visitor Management System</h1>
          <p className="text-gray-600">Welcome to your dashboard</p>
        </header>
        
        {/* Temporary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { title: "Total Visitors", value: "248", icon: "👥" },
            { title: "Checked In Today", value: "16", icon: "📝" },
            { title: "Pending Approval", value: "5", icon: "⏳" },
            { title: "Average Visit Duration", value: "45 min", icon: "⏱️" }
          ].map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
                </div>
                <div className="text-2xl">{stat.icon}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Visitor Activity</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded">
              <p className="text-gray-500">Visitor chart will be displayed here</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="#" className="block p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-medium text-purple-800 transition">
                Register New Visitor
              </a>
              <a href="#" className="block p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-medium text-purple-800 transition">
                Approve Visitors
              </a>
              <a href="#" className="block p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-medium text-purple-800 transition">
                Check-in Visitor
              </a>
              <a href="#" className="block p-3 bg-purple-100 hover:bg-purple-200 rounded-lg font-medium text-purple-800 transition">
                Manage Users
              </a>
            </div>
          </div>
        </div>
        
        {/* Recent Visitors */}
        <div className="bg-white p-6 rounded-lg shadow-md border border-purple-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Visitors</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Visitor Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Host</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check-in Time</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: "John Smith", purpose: "Meeting", host: "Sarah Johnson", status: "Checked In", time: "10:30 AM" },
                  { name: "Emily Davis", purpose: "Interview", host: "Michael Brown", status: "Pending", time: "11:15 AM" },
                  { name: "Robert Wilson", purpose: "Delivery", host: "Emma Davis", status: "Approved", time: "12:45 PM" },
                  { name: "Jennifer Lopez", purpose: "Repair", host: "David Lee", status: "Checked Out", time: "02:30 PM" },
                ].map((visitor, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">{visitor.name}</td>
                    <td className="py-3 px-4">{visitor.purpose}</td>
                    <td className="py-3 px-4">{visitor.host}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        visitor.status === "Checked In" ? "bg-green-100 text-green-800" :
                        visitor.status === "Pending" ? "bg-yellow-100 text-yellow-800" :
                        visitor.status === "Approved" ? "bg-blue-100 text-blue-800" :
                        "bg-gray-100 text-gray-800"
                      }`}>
                        {visitor.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">{visitor.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
