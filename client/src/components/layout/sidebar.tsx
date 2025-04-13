import { Link, useLocation } from "wouter";
import {
  UserCircle,
  LogOut,
  Home,
  ShieldCheck,
  Users,
  Settings,
  UserCheck,
  ClipboardList,
  LifeBuoy,
  ChevronDown,
  ChevronUp,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { UserRoles } from "@shared/schema";
import { useState } from "react";

interface SidebarProps {
  isMobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isMobile = false, onClose }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  const [expandedSection, setExpandedSection] = useState<string | null>("dashboard");

  const handleLogout = () => {
    logout();
  };

  const toggleSection = (section: string) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const isAdmin = user?.role === UserRoles.ADMIN;
  const isGuard = user?.role === UserRoles.GUARD || isAdmin;
  const isHost = user?.role === UserRoles.HOST || isAdmin;

  const NavItem = ({ 
    href, 
    icon: Icon, 
    children, 
    hasSubmenu = false,
    expanded = false
  }: { 
    href?: string; 
    icon: any; 
    children: React.ReactNode;
    hasSubmenu?: boolean;
    expanded?: boolean;
  }) => {
    const isActive = href ? location === href : false;
    
    return (
      <div className="w-full">
        {href ? (
          <Link href={href}>
            <a 
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                isActive 
                  ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              )}
              onClick={isMobile && onClose ? onClose : undefined}
            >
              <Icon className="h-4 w-4" />
              <span>{children}</span>
              {hasSubmenu && (
                expanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />
              )}
            </a>
          </Link>
        ) : (
          <button 
            className={cn(
              "w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            onClick={() => toggleSection(children as string)}
          >
            <Icon className="h-4 w-4" />
            <span>{children}</span>
            {hasSubmenu && (
              expanded ? <ChevronUp className="ml-auto h-4 w-4" /> : <ChevronDown className="ml-auto h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={cn(
      "flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border",
      isMobile && "w-full"
    )}>
      <div className="py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold">
            Visitor Management
          </h2>
          <div className="space-y-1">
            <NavItem href="/" icon={Home}>
              Dashboard
            </NavItem>
            
            {isGuard && (
              <NavItem href="/guard" icon={ShieldCheck}>
                Guard Portal
              </NavItem>
            )}
            
            {isHost && (
              <NavItem href="/host" icon={UserCheck}>
                Host Portal
              </NavItem>
            )}
            
            {isAdmin && (
              <NavItem 
                icon={Settings} 
                hasSubmenu={true} 
                expanded={expandedSection === "Admin"}
              >
                Admin
              </NavItem>
            )}
            
            {isAdmin && expandedSection === "Admin" && (
              <div className="pl-4 py-1 space-y-1">
                <NavItem href="/admin" icon={ClipboardList}>
                  Dashboard
                </NavItem>
                <NavItem href="/admin?tab=users" icon={Users}>
                  Users
                </NavItem>
                <NavItem href="/admin?tab=devices" icon={Box}>
                  IoT Devices
                </NavItem>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-auto p-4">
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <UserCircle className="h-8 w-8" />
          <div className="flex flex-col truncate">
            <span className="text-sm font-medium">{user?.name}</span>
            <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
          </div>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="mt-2 w-full"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Log out
        </Button>
      </div>
    </div>
  );
}
