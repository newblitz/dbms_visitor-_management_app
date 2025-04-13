import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, Info, X, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";

interface ApprovalListProps {
  visitors: any[];
  onSelect: (visitor: any) => void;
  onApprove: (id: number) => Promise<void>;
  onReject: (id: number, comments: string) => Promise<void>;
}

export function ApprovalList({ visitors, onSelect, onApprove, onReject }: ApprovalListProps) {
  const [selectedVisitor, setSelectedVisitor] = useState<any | null>(null);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleOpenRejectDialog = (visitor: any) => {
    setSelectedVisitor(visitor);
    setRejectionReason("");
    setIsRejectDialogOpen(true);
  };
  
  const handleReject = async () => {
    if (!selectedVisitor) return;
    
    setIsSubmitting(true);
    try {
      await onReject(selectedVisitor.id, rejectionReason);
      setIsRejectDialogOpen(false);
    } catch (error) {
      console.error("Failed to reject visitor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleApprove = async (visitor: any) => {
    setIsSubmitting(true);
    try {
      await onApprove(visitor.id);
    } catch (error) {
      console.error("Failed to approve visitor:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (visitors.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">No pending approval requests</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visitors.map((visitor) => (
        <Card key={visitor.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col sm:flex-row">
              <div className="p-4 sm:p-6 flex-grow">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    {visitor.photoUrl ? (
                      <AvatarImage src={visitor.photoUrl} alt={visitor.name} />
                    ) : (
                      <AvatarFallback>{visitor.name.charAt(0)}</AvatarFallback>
                    )}
                  </Avatar>
                  
                  <div className="flex-grow">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <h3 className="font-medium text-lg">{visitor.name}</h3>
                      <div className="flex items-center space-x-1 text-yellow-600 bg-yellow-50 px-2 py-1 rounded text-xs">
                        <Clock className="h-3 w-3" />
                        <span>Pending Approval</span>
                      </div>
                    </div>
                    
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                        <div>Aadhar ID: {visitor.aadharId}</div>
                        {visitor.mobile && <div>Mobile: {visitor.mobile}</div>}
                        {visitor.email && <div>Email: {visitor.email}</div>}
                        <div>Registered: {new Date(visitor.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <h4 className="text-sm font-medium">Purpose of Visit</h4>
                      <p className="text-sm text-muted-foreground mt-1">{visitor.purpose}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end mt-4 space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onSelect(visitor)}
                  >
                    <Info className="h-4 w-4 mr-1" />
                    Details
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                    onClick={() => handleOpenRejectDialog(visitor)}
                    disabled={isSubmitting}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm"
                    className="border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                    onClick={() => handleApprove(visitor)}
                    disabled={isSubmitting}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
              
              {visitor.photoUrl && (
                <div className="sm:w-1/4 w-full h-40 sm:h-auto">
                  <img 
                    src={visitor.photoUrl} 
                    alt={visitor.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
      
      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Visitor</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this visitor request.
            </DialogDescription>
          </DialogHeader>
          
          {selectedVisitor && (
            <div className="py-2">
              <div className="flex items-center space-x-3 mb-4">
                <Avatar className="h-10 w-10">
                  {selectedVisitor.photoUrl ? (
                    <AvatarImage src={selectedVisitor.photoUrl} alt={selectedVisitor.name} />
                  ) : (
                    <AvatarFallback>{selectedVisitor.name.charAt(0)}</AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{selectedVisitor.name}</p>
                  <p className="text-sm text-muted-foreground">Purpose: {selectedVisitor.purpose}</p>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="space-y-2">
                <label htmlFor="rejection-reason" className="text-sm font-medium">
                  Reason for Rejection
                </label>
                <Textarea
                  id="rejection-reason"
                  placeholder="Please explain why you're rejecting this visitor"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="min-h-[100px]"
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </div>
              ) : (
                <div className="flex items-center">
                  <X className="mr-2 h-4 w-4" />
                  Reject Visitor
                </div>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
