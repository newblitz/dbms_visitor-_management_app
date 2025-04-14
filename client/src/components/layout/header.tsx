import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Menu, Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface HeaderProps {
  onToggleSidebar: () => void;
  title: string;
  subtitle?: string;
}

export function Header({ onToggleSidebar, title, subtitle }: HeaderProps) {
  const { user } = useAuth();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  // Mock notifications - in a real app, this would come from the backend
  const notifications = [
    { id: 1, message: "New visitor waiting for approval", time: "5 minutes ago" },
    { id: 2, message: "John Doe has checked in", time: "1 hour ago" },
  ];

  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-neutral-200">
      {/* Mobile Menu Button */}
      <button 
        className="md:hidden text-neutral-500 focus:outline-none" 
        onClick={onToggleSidebar}
      >
        <Menu className="h-6 w-6" />
      </button>
      
      {/* Page Title (Mobile) */}
      <div className="md:hidden font-bold text-primary-500 text-lg">{title}</div>
      
      {/* Page Title (Desktop) */}
      <div className="hidden md:block">
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500">{subtitle}</p>}
      </div>
      
      {/* Notification and Profile */}
      <div className="flex items-center">
        {/* Notifications */}
        <div className="relative mr-4">
          <button 
            className="text-neutral-500 hover:text-neutral-700 focus:outline-none"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
          >
            <Bell className="h-6 w-6" />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            )}
          </button>
          
          {/* Notifications Dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-neutral-200 rounded-md shadow-lg z-10">
              <div className="flex items-center justify-between p-4 border-b border-neutral-200">
                <h3 className="font-semibold">Notifications</h3>
                <button 
                  className="text-neutral-500 hover:text-neutral-700"
                  onClick={() => setNotificationsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {notifications.length > 0 ? (
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map(notification => (
                    <div key={notification.id} className="p-4 border-b border-neutral-100 hover:bg-neutral-50">
                      <p className="text-sm font-medium">{notification.message}</p>
                      <p className="text-xs text-neutral-500 mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-neutral-500">
                  No new notifications
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Register Visitor Button (for guards) */}
        {(user?.role === "guard" || user?.role === "admin") && (
          <Link href="/guard/register">
            <Button size="sm" className="mr-4 hidden md:flex">
              Register Visitor
            </Button>
          </Link>
        )}
        
        {/* User Menu (Mobile) */}
        <div className="md:hidden">
          <button className="flex items-center focus:outline-none">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
              {user?.name ? user.name.substring(0, 2).toUpperCase() : ""}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
}
