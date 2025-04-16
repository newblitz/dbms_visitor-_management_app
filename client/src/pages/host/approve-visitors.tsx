import { useState } from "react";
import { UserRole, VisitorStatus } from "@shared/schema";

export default function ApproveVisitors() {
  const [visitors, setVisitors] = useState([
    { 
      id: 1, 
      name: "John Smith", 
      purpose: "Interview", 
      company: "ABC Corp", 
      phone: "555-1234", 
      email: "john@example.com",
      status: VisitorStatus.PENDING,
      createdAt: new Date().toISOString()
    },
    { 
      id: 2, 
      name: "Emma Watson", 
      purpose: "Meeting", 
      company: "XYZ Inc", 
      phone: "555-5678", 
      email: "emma@example.com",
      status: VisitorStatus.PENDING,
      createdAt: new Date().toISOString()
    },
    { 
      id: 3, 
      name: "Michael Johnson", 
      purpose: "Site inspection", 
      company: "123 Industries", 
      phone: "555-9012", 
      email: "michael@example.com",
      status: VisitorStatus.PENDING,
      createdAt: new Date().toISOString()
    }
  ]);

  const [processingId, setProcessingId] = useState<number | null>(null);
  const [notes, setNotes] = useState<string>("");

  const handleApprove = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setVisitors(visitors.map(visitor => 
        visitor.id === id ? { ...visitor, status: VisitorStatus.APPROVED } : visitor
      ));
      setProcessingId(null);
      setNotes("");
    }, 500);
  };

  const handleReject = (id: number) => {
    setProcessingId(id);
    setTimeout(() => {
      setVisitors(visitors.map(visitor => 
        visitor.id === id ? { ...visitor, status: VisitorStatus.REJECTED } : visitor
      ));
      setProcessingId(null);
      setNotes("");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      <div className="container mx-auto p-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-purple-800 mb-2">Approve Visitors</h1>
          <p className="text-gray-600">Review and approve visitor requests</p>
        </header>

        <div className="bg-white rounded-lg shadow-md border border-purple-100 p-6">
          <h2 className="text-xl font-semibold mb-4">Pending Visitors</h2>
          
          {visitors.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No pending visitors at this time</p>
            </div>
          ) : (
            <div className="space-y-4">
              {visitors.map(visitor => (
                <div key={visitor.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-lg">{visitor.name}</h3>
                      <p className="text-sm text-gray-600">
                        {visitor.company && <span className="mr-3">Company: {visitor.company}</span>}
                        <span className="mr-3">Phone: {visitor.phone}</span>
                        {visitor.email && <span>Email: {visitor.email}</span>}
                      </p>
                      <p className="mt-1"><span className="font-medium">Purpose:</span> {visitor.purpose}</p>
                      
                      <div className="mt-3">
                        <p className="font-medium mb-1">Notes:</p>
                        <textarea 
                          className="w-full border rounded p-2 text-sm"
                          rows={2}
                          placeholder="Add optional notes about this visitor"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                        ></textarea>
                      </div>
                    </div>
                    
                    <div className="flex flex-col justify-center space-y-2 min-w-[150px]">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${visitor.status === VisitorStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : 
                            visitor.status === VisitorStatus.APPROVED ? 'bg-green-100 text-green-800' : 
                            'bg-red-100 text-red-800'}`}>
                          {visitor.status}
                        </span>
                      </div>
                      
                      {visitor.status === VisitorStatus.PENDING && (
                        <div className="flex space-x-2 mt-2">
                          <button
                            onClick={() => handleApprove(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg"
                          >
                            {processingId === visitor.id ? "Processing..." : "Approve"}
                          </button>
                          <button
                            onClick={() => handleReject(visitor.id)}
                            disabled={processingId === visitor.id}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg"
                          >
                            {processingId === visitor.id ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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