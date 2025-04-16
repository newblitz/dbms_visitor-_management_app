import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { VisitorStatus } from "@shared/schema";
import { Check, X, Info, Clock } from "lucide-react";
import { format } from "date-fns";

export default function ApproveVisitors() {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<number | null>(null);
  
  // Mock data - this would come from API in a real app
  const [pendingVisitors, setPendingVisitors] = useState([
    {
      id: 1,
      name: "John Smith",
      purpose: "Job Interview",
      company: "ABC Corp",
      phone: "+91 98765 43210",
      email: "john@example.com",
      time: new Date(new Date().getTime() - 30 * 60000).toISOString(),
      expectedDuration: 60,
      photo: "https://randomuser.me/api/portraits/men/1.jpg"
    },
    {
      id: 2,
      name: "Mary Johnson",
      purpose: "Business Meeting",
      company: "XYZ Industries",
      phone: "+91 87654 32109",
      email: "mary@example.com",
      time: new Date(new Date().getTime() - 15 * 60000).toISOString(),
      expectedDuration: 45,
      photo: "https://randomuser.me/api/portraits/women/2.jpg"
    }
  ]);

  const handleApprove = (id: number) => {
    setProcessingId(id);
    
    // Simulate API call
    setTimeout(() => {
      setPendingVisitors(pendingVisitors.filter(visitor => visitor.id !== id));
      setProcessingId(null);
      
      toast({
        title: "Visitor approved",
        description: "The visitor has been notified that they can proceed.",
      });
    }, 1000);
  };

  const handleReject = (id: number) => {
    setProcessingId(id);
    
    // Simulate API call
    setTimeout(() => {
      setPendingVisitors(pendingVisitors.filter(visitor => visitor.id !== id));
      setProcessingId(null);
      
      toast({
        title: "Visitor rejected",
        description: "The visitor has been notified that they cannot proceed.",
        variant: "destructive"
      });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Pending Visitor Approvals</h1>
          <p className="text-gray-600">Review and approve visitors waiting to meet you</p>
        </header>

        {pendingVisitors.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-purple-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">All caught up!</h2>
            <p className="text-gray-600 mb-6">You have no pending visitor requests.</p>
            <button 
              onClick={() => window.location.href = '/dashboard'}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {pendingVisitors.map(visitor => (
              <div key={visitor.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="border-b px-6 py-4 flex justify-between items-center bg-purple-50">
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-purple-200">
                      <img 
                        src={visitor.photo} 
                        alt={visitor.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-800">{visitor.name}</h3>
                      <p className="text-sm text-gray-600">{visitor.company}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 text-purple-600 mr-1" />
                    <span className="text-sm text-purple-600">
                      {format(new Date(visitor.time), "h:mm a")}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Purpose</p>
                      <p className="text-gray-800">{visitor.purpose}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Duration</p>
                      <p className="text-gray-800">{visitor.expectedDuration} minutes</p>
                    </div>
                  </div>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Phone</p>
                      <p className="text-gray-800">{visitor.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 mb-1">Email</p>
                      <p className="text-gray-800">{visitor.email || "Not provided"}</p>
                    </div>
                  </div>
                </div>
                <div className="px-6 py-4 bg-gray-50 border-t flex justify-between">
                  <button
                    onClick={() => handleReject(visitor.id)}
                    disabled={processingId === visitor.id}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 disabled:opacity-50"
                  >
                    <X className="h-4 w-4 inline-block mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApprove(visitor.id)}
                    disabled={processingId === visitor.id}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check className="h-4 w-4 inline-block mr-1" />
                    Approve
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}