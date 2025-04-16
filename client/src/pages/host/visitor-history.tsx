import { useState } from "react";
import { VisitorStatus } from "@shared/schema";

export default function VisitorHistory() {
  const [visitors, setVisitors] = useState([
    { 
      id: 1, 
      name: "John Smith", 
      purpose: "Meeting", 
      company: "ABC Corp", 
      status: VisitorStatus.CHECKED_OUT,
      checkinTime: "09:30 AM",
      checkoutTime: "11:45 AM", 
      date: "2023-04-15",
      duration: "2h 15m"
    },
    { 
      id: 2, 
      name: "Emma Watson", 
      purpose: "Interview", 
      company: "XYZ Inc", 
      status: VisitorStatus.CHECKED_OUT,
      checkinTime: "01:15 PM",
      checkoutTime: "02:30 PM", 
      date: "2023-04-15",
      duration: "1h 15m"
    },
    { 
      id: 3, 
      name: "Robert Wilson", 
      purpose: "Project Discussion", 
      company: "123 Industries", 
      status: VisitorStatus.CHECKED_OUT,
      checkinTime: "10:00 AM",
      checkoutTime: "11:30 AM", 
      date: "2023-04-14",
      duration: "1h 30m"
    },
    { 
      id: 4, 
      name: "Michael Johnson", 
      purpose: "Contract Signing", 
      company: "Johnson Inc", 
      status: VisitorStatus.CHECKED_OUT,
      checkinTime: "02:00 PM",
      checkoutTime: "03:15 PM", 
      date: "2023-04-13",
      duration: "1h 15m"
    }
  ]);

  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredVisitors = visitors.filter(visitor => {
    if (searchTerm && !visitor.name.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    
    if (filter === "today") {
      return visitor.date === "2023-04-15"; // Today's mock date
    }
    
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Visitor History</h1>
          <p className="text-gray-600">View history of all visitors who have met with you</p>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-purple-100 p-6">
          <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setFilter("all")}
                className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                All Time
              </button>
              <button 
                onClick={() => setFilter("today")}
                className={`px-4 py-2 rounded-lg ${filter === 'today' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700'}`}
              >
                Today
              </button>
            </div>
            
            <div className="w-full md:w-64">
              <input
                type="text"
                placeholder="Search visitors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Visitor</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check-in</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check-out</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Duration</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-gray-500">
                      No visitor history found
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map(visitor => (
                    <tr key={visitor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{visitor.name}</div>
                        <div className="text-xs text-gray-500">{visitor.company}</div>
                      </td>
                      <td className="py-3 px-4">{visitor.purpose}</td>
                      <td className="py-3 px-4">{visitor.date}</td>
                      <td className="py-3 px-4">{visitor.checkinTime}</td>
                      <td className="py-3 px-4">{visitor.checkoutTime}</td>
                      <td className="py-3 px-4">{visitor.duration}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="mt-4">
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="text-purple-600 hover:text-purple-800 font-medium"
          >
            &larr; Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}