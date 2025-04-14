import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  Home,
  UserPlus,
  Users,
  ClipboardCheck,
  History,
  Settings,
  User,
  LogOut,
  BarChart3,
  Cpu
} from "lucide-react";

interface SidebarItemProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  active?: boolean;
}

function SidebarItem({ to, icon, children, active }: SidebarItemProps) {
  return (
    <li>
      <Link href={to}>
        <a className={`sidebar-item ${active ? "active" : ""}`}>
          {icon}
          <span className="ml-3">{children}</span>
        </a>
      </Link>
    </li>
  );
}

export function Sidebar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const isPath = (path: string) => location === path;
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r border-neutral-200">
      {/* Logo and Brand */}
      <div className="flex items-center justify-center h-16 px-4 border-b border-neutral-200">
        <span className="text-xl font-bold text-primary-500">VisitorMS</span>
      </div>
      
      {/* User Profile */}
      <div className="flex items-center p-4 border-b border-neutral-200">
        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
          {user.name.substring(0, 2).toUpperCase()}
        </div>
        <div className="ml-3">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-neutral-500">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto pt-4">
        <ul>
          <li className="px-2 pb-1">
            <span className="text-xs font-medium text-neutral-500 px-4">MENU</span>
          </li>
          
          <SidebarItem to="/" icon={<Home className="h-5 w-5 mr-3" />} active={isPath("/")}>
            Dashboard
          </SidebarItem>
          
          {/* Guard-specific menu items */}
          {(user.role === "guard" || user.role === "admin") && (
            <>
              <li className="px-2 pb-1 pt-6">
                <span className="text-xs font-medium text-neutral-500 px-4">GUARD</span>
              </li>
              <SidebarItem 
                to="/guard/register" 
                icon={<UserPlus className="h-5 w-5 mr-3" />}
                active={isPath("/guard/register")}
              >
                Register Visitor
              </SidebarItem>
              <SidebarItem 
                to="/guard/visitors" 
                icon={<Users className="h-5 w-5 mr-3" />}
                active={isPath("/guard/visitors")}
              >
                Visitors List
              </SidebarItem>
            </>
          )}
          
          {/* Host-specific menu items */}
          {(user.role === "host" || user.role === "admin") && (
            <>
              <li className="px-2 pb-1 pt-6">
                <span className="text-xs font-medium text-neutral-500 px-4">HOST</span>
              </li>
              <SidebarItem 
                to="/host/approve" 
                icon={<ClipboardCheck className="h-5 w-5 mr-3" />}
                active={isPath("/host/approve")}
              >
                Approve Visitors
              </SidebarItem>
              <SidebarItem 
                to="/host/history" 
                icon={<History className="h-5 w-5 mr-3" />}
                active={isPath("/host/history")}
              >
                Visitor History
              </SidebarItem>
            </>
          )}
          
          {/* Admin-specific menu items */}
          {user.role === "admin" && (
            <>
              <li className="px-2 pb-1 pt-6">
                <span className="text-xs font-medium text-neutral-500 px-4">ADMIN</span>
              </li>
              <SidebarItem 
                to="/admin/users" 
                icon={<User className="h-5 w-5 mr-3" />}
                active={isPath("/admin/users")}
              >
                Users
              </SidebarItem>
              <SidebarItem 
                to="/admin/devices" 
                icon={<Cpu className="h-5 w-5 mr-3" />}
                active={isPath("/admin/devices")}
              >
                IoT Devices
              </SidebarItem>
              <SidebarItem 
                to="/admin/reports" 
                icon={<BarChart3 className="h-5 w-5 mr-3" />}
                active={isPath("/admin/reports")}
              >
                Reports
              </SidebarItem>
              <SidebarItem 
                to="/admin/settings" 
                icon={<Settings className="h-5 w-5 mr-3" />}
                active={isPath("/admin/settings")}
              >
                Settings
              </SidebarItem>
            </>
          )}
        </ul>
      </nav>
      
      {/* Logout */}
      <div className="p-4 border-t border-neutral-200">
        <button 
          onClick={() => logout()} 
          className="flex w-full items-center px-4 py-2 text-neutral-700 hover:bg-red-50 hover:text-red-500 rounded-md transition-colors"
        >
          <LogOut className="h-5 w-5 mr-3" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
