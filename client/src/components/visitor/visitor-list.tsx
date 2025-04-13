import { VisitorStatus } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { AlertCircle, ArrowRight, CheckSquare, Clock, Info, UserCheck, XSquare } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface VisitorListProps {
  visitors: any[];
  onSelect: (visitor: any) => void;
  showCheckInButton?: boolean;
  showCheckOutButton?: boolean;
  onCheckIn?: (id: number) => Promise<void>;
  onCheckOut?: (id: number) => Promise<void>;
}

export function VisitorList({ 
  visitors, 
  onSelect, 
  showCheckInButton = false,
  showCheckOutButton = false,
  onCheckIn,
  onCheckOut
}: VisitorListProps) {
  if (visitors.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center p-8">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
        <p className="text-center text-muted-foreground">No visitors found</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {visitors.map((visitor) => (
        <Card key={visitor.id} className="p-4 hover:bg-accent/5 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Avatar className="h-12 w-12 mr-4">
                {visitor.photoUrl ? (
                  <AvatarImage src={visitor.photoUrl} alt={visitor.name} />
                ) : (
                  <AvatarFallback>{visitor.name.charAt(0)}</AvatarFallback>
                )}
              </Avatar>
              
              <div>
                <h3 className="font-medium">{visitor.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="mr-2">Purpose: {visitor.purpose}</span>
                  {visitor.status && (
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
                    >
                      {visitor.status.replace('_', ' ')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {showCheckInButton && visitor.status === VisitorStatus.APPROVED && onCheckIn && (
                <Button size="sm" onClick={() => onCheckIn(visitor.id)}>
                  <UserCheck className="h-4 w-4 mr-1" />
                  Check In
                </Button>
              )}
              
              {showCheckOutButton && visitor.status === VisitorStatus.CHECKED_IN && onCheckOut && (
                <Button size="sm" variant="outline" onClick={() => onCheckOut(visitor.id)}>
                  <ArrowRight className="h-4 w-4 mr-1" />
                  Check Out
                </Button>
              )}
              
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => onSelect(visitor)}
              >
                <Info className="h-4 w-4 mr-1" />
                Details
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
