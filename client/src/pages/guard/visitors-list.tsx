import { useState } from "react";
import { VisitorStatus } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function VisitorsList() {
  const { toast } = useToast();
  const [visitors, setVisitors] = useState([
    { 
      id: 1, 
      name: "John Smith", 
      purpose: "Meeting", 
      host: "Sarah Johnson", 
      company: "ABC Corp", 
      phone: "555-1234", 
      email: "john@example.com",
      status: VisitorStatus.APPROVED,
      checkinTime: null,
      checkoutTime: null
    },
    { 
      id: 2, 
      name: "Emma Watson", 
      purpose: "Interview", 
      host: "Michael Brown", 
      company: "XYZ Inc", 
      phone: "555-5678", 
      email: "emma@example.com",
      status: VisitorStatus.APPROVED,
      checkinTime: null,
      checkoutTime: null
    },
    { 
      id: 3, 
      name: "Robert Wilson", 
      purpose: "Delivery", 
      host: "Emma Davis", 
      company: "123 Industries", 
      phone: "555-9012", 
      email: "robert@example.com",
      status: VisitorStatus.CHECKED_IN,
      checkinTime: "10:30 AM",
      checkoutTime: null
    },
    { 
      id: 4, 
      name: "Jennifer Lopez", 
      purpose: "Maintenance", 
      host: "David Lee", 
      company: "Maintenance Co", 
      phone: "555-3456", 
      email: "jennifer@example.com",
      status: VisitorStatus.CHECKED_IN,
      checkinTime: "11:45 AM",
      checkoutTime: null
    }
  ]);

  const [processingId, setProcessingId] = useState<number | null>(null);

  const handleCheckIn = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setVisitors(visitors.map(visitor => 
        visitor.id === id ? { 
          ...visitor, 
          status: VisitorStatus.CHECKED_IN, 
          checkinTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        } : visitor
      ));
      setProcessingId(null);
      
      toast({
        title: "Visitor checked in",
        description: "Visitor has been successfully checked in",
      });
    }, 500);
  };

  const handleCheckOut = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setVisitors(visitors.map(visitor => 
        visitor.id === id ? { 
          ...visitor, 
          status: VisitorStatus.CHECKED_OUT, 
          checkoutTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
        } : visitor
      ));
      setProcessingId(null);
      
      toast({
        title: "Visitor checked out",
        description: "Visitor has been successfully checked out",
      });
    }, 500);
  };

  const getStatusBadgeClass = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.PENDING:
        return "bg-yellow-100 text-yellow-800";
      case VisitorStatus.APPROVED:
        return "bg-blue-100 text-blue-800";
      case VisitorStatus.CHECKED_IN:
        return "bg-green-100 text-green-800";
      case VisitorStatus.CHECKED_OUT:
        return "bg-gray-100 text-gray-800";
      case VisitorStatus.REJECTED:
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Visitors List</h1>
          <p className="text-gray-600">Manage visitor check-ins and check-outs</p>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-purple-100 p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold">Today's Visitors</h2>
            <button 
              onClick={() => window.location.href = '/guard/register'} 
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Register New Visitor
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Purpose</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Host</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check-in</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Check-out</th>
                  <th className="text-left py-3 px-4 font-semibold text-sm text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visitors.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-4 text-center text-gray-500">
                      No visitors found
                    </td>
                  </tr>
                ) : (
                  visitors.map(visitor => (
                    <tr key={visitor.id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="font-medium">{visitor.name}</div>
                        <div className="text-xs text-gray-500">{visitor.phone}</div>
                      </td>
                      <td className="py-3 px-4">{visitor.purpose}</td>
                      <td className="py-3 px-4">{visitor.host}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(visitor.status)}`}>
                          {visitor.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {visitor.checkinTime || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {visitor.checkoutTime || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {visitor.status === VisitorStatus.APPROVED && (
                          <button
                            onClick={() => handleCheckIn(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 mr-2"
                          >
                            {processingId === visitor.id ? "Processing..." : "Check In"}
                          </button>
                        )}
                        
                        {visitor.status === VisitorStatus.CHECKED_IN && (
                          <button
                            onClick={() => handleCheckOut(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded hover:bg-gray-700"
                          >
                            {processingId === visitor.id ? "Processing..." : "Check Out"}
                          </button>
                        )}
                      </td>
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