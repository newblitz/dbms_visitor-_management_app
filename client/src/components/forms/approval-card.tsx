import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Visitor, VisitorStatus } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import { AlertCircle, CheckCircle, XCircle, Clock } from "lucide-react";

interface ApprovalCardProps {
  visitor: Visitor;
  onApprove: (id: number, notes: string) => void;
  onReject: (id: number, notes: string) => void;
  isProcessing: boolean;
}

export function ApprovalCard({ visitor, onApprove, onReject, isProcessing }: ApprovalCardProps) {
  const [notes, setNotes] = useState("");
  
  const getStatusBadge = (status: VisitorStatus) => {
    switch (status) {
      case VisitorStatus.APPROVED:
        return <Badge className="bg-green-100 text-green-800 border-green-300">Approved</Badge>;
      case VisitorStatus.REJECTED:
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rejected</Badge>;
      case VisitorStatus.PENDING:
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pending</Badge>;
      case VisitorStatus.CHECKED_IN:
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Checked In</Badge>;
      case VisitorStatus.CHECKED_OUT:
        return <Badge className="bg-gray-100 text-gray-800 border-gray-300">Checked Out</Badge>;
      default:
        return null;
    }
  };

  return (
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-bold">{visitor.name}</CardTitle>
          {getStatusBadge(visitor.status as VisitorStatus)}
        </div>
        <div className="text-sm text-neutral-500 flex items-center space-x-1">
          <Clock className="h-3.5 w-3.5 inline" />
          <span>
            {formatDistanceToNow(new Date(visitor.createdAt), { addSuffix: true })}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            {visitor.photoUrl ? (
              <img 
                src={visitor.photoUrl} 
                alt={visitor.name} 
                className="visitor-photo w-full h-auto max-h-[200px] object-cover rounded"
              />
            ) : (
              <div className="bg-neutral-100 rounded w-full h-[200px] flex items-center justify-center text-neutral-400">
                No photo
              </div>
            )}
          </div>
          
          <div className="md:col-span-2 space-y-2">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Phone</h3>
                <p className="text-sm">{visitor.phone}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-neutral-500">ID</h3>
                <p className="text-sm">{visitor.aadharId}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Company</h3>
                <p className="text-sm">{visitor.company || "-"}</p>
              </div>
              
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Expected Duration</h3>
                <p className="text-sm">{visitor.expectedDuration} min</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-xs font-medium text-neutral-500">Purpose</h3>
              <p className="text-sm mt-1">{visitor.purpose}</p>
            </div>
            
            {visitor.notes && (
              <div>
                <h3 className="text-xs font-medium text-neutral-500">Notes</h3>
                <p className="text-sm mt-1 italic">{visitor.notes}</p>
              </div>
            )}
            
            {visitor.status === VisitorStatus.PENDING && (
              <div className="mt-3">
                <Textarea
                  placeholder="Add notes (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      {visitor.status === VisitorStatus.PENDING && (
        <CardFooter className="justify-end space-x-2 pt-0">
          <Button
            variant="outline"
            className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => onReject(visitor.id, notes)}
            disabled={isProcessing}
          >
            <XCircle className="mr-1 h-4 w-4" />
            Reject
          </Button>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onApprove(visitor.id, notes)}
            disabled={isProcessing}
          >
            <CheckCircle className="mr-1 h-4 w-4" />
            Approve
          </Button>
        </CardFooter>
      )}
      
      {visitor.status === VisitorStatus.APPROVED && (
        <CardFooter className="justify-end pt-0">
          <div className="text-sm text-green-600 font-medium flex items-center">
            <CheckCircle className="mr-1 h-4 w-4" />
            Approved
          </div>
        </CardFooter>
      )}
      
      {visitor.status === VisitorStatus.REJECTED && (
        <CardFooter className="justify-end pt-0">
          <div className="text-sm text-red-600 font-medium flex items-center">
            <XCircle className="mr-1 h-4 w-4" />
            Rejected
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
