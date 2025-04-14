import { ArrowUpIcon, ArrowDownIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  changeValue?: number;
  changeText?: string;
  changeType?: "increase" | "decrease" | "neutral";
}

export function StatsCard({ 
  title, 
  value, 
  icon, 
  changeValue, 
  changeText,
  changeType = "neutral" 
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-neutral-500">{title}</h2>
          <div className="text-primary-500">
            {icon}
          </div>
        </div>
        
        <p className="mt-4 text-3xl font-bold text-neutral-900">{value}</p>
        
        {(changeValue !== undefined || changeText) && (
          <div className="mt-2 flex items-center text-sm">
            {changeType === "increase" && (
              <ArrowUpIcon className="h-4 w-4 text-green-500 mr-1 flex-shrink-0" />
            )}
            {changeType === "decrease" && (
              <ArrowDownIcon className="h-4 w-4 text-red-500 mr-1 flex-shrink-0" />
            )}
            
            {changeValue !== undefined && (
              <span className={
                changeType === "increase" ? "text-green-500" : 
                changeType === "decrease" ? "text-red-500" : 
                "text-neutral-500"
              }>
                {changeValue > 0 ? "+" : ""}{changeValue}%
              </span>
            )}
            
            {changeText && (
              <span className="text-neutral-500 ml-1">{changeText}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
