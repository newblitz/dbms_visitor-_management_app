import { UserRoles, VisitorStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, ChevronLeft, Clock, Info, PhoneCall, AtSign, FileText, UserCheck, X, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface VisitorDetailsProps {
  visitor: any;
  onBack: () => void;
  onCheckIn?: (id: number) => Promise<void>;
  onCheckOut?: (id: number) => Promise<void>;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number, comments: string) => Promise<void>;
  showApproveReject?: boolean;
}

export function VisitorDetails({ 
  visitor, 
  onBack,
  onCheckIn,
  onCheckOut,
  onApprove,
  onReject,
  showApproveReject = false
}: VisitorDetailsProps) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const { user } = useAuth();
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case VisitorStatus.PENDING:
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case VisitorStatus.APPROVED:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case VisitorStatus.REJECTED:
        return <XCircle className="h-5 w-5 text-red-500" />;
      case VisitorStatus.CHECKED_IN:
        return <UserCheck className="h-5 w-5 text-blue-500" />;
      case VisitorStatus.CHECKED_OUT:
        return <Info className="h-5 w-5 text-gray-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };
  
  const handleReject = () => {
    if (onReject) {
      onReject(visitor.id, rejectionReason);
      setIsRejectDialogOpen(false);
    }
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            className="mb-2"
            onClick={onBack}
          >
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <Badge 
            variant={
              visitor.status === VisitorStatus.PENDING 
                ? "outline" 
                : visitor.status === VisitorStatus.APPROVED 
                ? "secondary" 
                : visitor.status === VisitorStatus.REJECTED 
                ? "destructive" 
                : visitor.status === VisitorStatus.CHECKED_IN 
                ? "default" 
                : "outline"
            }
            className="flex items-center gap-1"
          >
            {getStatusIcon(visitor.status)}
            {visitor.status.replace('_', ' ')}
          </Badge>
        </div>
        <CardTitle className="text-xl">Visitor Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-6">
          <div className="flex-shrink-0">
            {visitor.photoUrl ? (
              <div className="w-40 h-40 rounded-md overflow-hidden border">
                <img 
                  src={visitor.photoUrl} 
                  alt={visitor.name} 
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <Avatar className="w-40 h-40">
                <AvatarFallback className="text-4xl">{visitor.name.charAt(0)}</AvatarFallback>
              </Avatar>
            )}
          </div>
          
          <div className="flex-grow space-y-3">
            <h2 className="text-2xl font-bold">{visitor.name}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">Aadhar ID: {visitor.aadharId}</span>
              </div>
              
              {visitor.mobile && (
                <div className="flex items-center">
                  <PhoneCall className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Mobile: {visitor.mobile}</span>
                </div>
              )}
              
              {visitor.email && (
                <div className="flex items-center">
                  <AtSign className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">Email: {visitor.email}</span>
                </div>
              )}
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                <span className="text-sm">
                  Registered: {new Date(visitor.createdAt).toLocaleString()}
                </span>
              </div>
              
              {visitor.checkInTime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Check In: {new Date(visitor.checkInTime).toLocaleString()}
                  </span>
                </div>
              )}
              
              {visitor.checkOutTime && (
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span className="text-sm">
                    Check Out: {new Date(visitor.checkOutTime).toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Purpose of Visit</h3>
          <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
            {visitor.purpose}
          </p>
        </div>
        
        {visitor.comments && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Comments</h3>
            <p className="text-sm text-muted-foreground p-3 bg-muted rounded-md">
              {visitor.comments}
            </p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to List
        </Button>
        
        <div className="space-x-2">
          {showApproveReject && onApprove && onReject && (
            <>
              <Button 
                variant="outline" 
                className="border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
                onClick={() => setIsRejectDialogOpen(true)}
              >
                <X className="mr-2 h-4 w-4" />
                Reject
              </Button>
              <Button 
                className="border-green-200 bg-green-50 text-green-600 hover:bg-green-100"
                onClick={() => onApprove(visitor.id)}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approve
              </Button>
            </>
          )}
          
          {visitor.status === VisitorStatus.APPROVED && onCheckIn && (
            user?.role === UserRoles.GUARD || user?.role === UserRoles.ADMIN) && (
              <Button onClick={() => onCheckIn(visitor.id)}>
                <UserCheck className="mr-2 h-4 w-4" />
                Check In
              </Button>
            )}
          
          {visitor.status === VisitorStatus.CHECKED_IN && onCheckOut && (
            user?.role === UserRoles.GUARD || user?.role === UserRoles.ADMIN) && (
              <Button variant="outline" onClick={() => onCheckOut(visitor.id)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Check Out
              </Button>
            )}
        </div>
      </CardFooter>
      
      {/* Rejection Dialog */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Visitor</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this visitor request.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Reason for rejection"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={!rejectionReason.trim()}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
