import { useLocation, Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { Home, UserPlus, ClipboardCheck, Users, Settings } from "lucide-react";

export function MobileNav() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  if (!user) return null;
  
  const isPath = (path: string) => location === path;
  
  return (
    <div className="md:hidden bg-white border-t border-neutral-200 fixed bottom-0 left-0 right-0 z-10">
      <div className="flex items-center justify-around py-3">
        <Link href="/">
          <a className={`flex flex-col items-center ${isPath("/") ? "text-primary-500" : "text-neutral-500"}`}>
            <Home className="h-6 w-6" />
            <span className="text-xs mt-1">Dashboard</span>
          </a>
        </Link>
        
        {(user.role === "guard" || user.role === "admin") && (
          <Link href="/guard/register">
            <a className={`flex flex-col items-center ${isPath("/guard/register") ? "text-primary-500" : "text-neutral-500"}`}>
              <UserPlus className="h-6 w-6" />
              <span className="text-xs mt-1">Register</span>
            </a>
          </Link>
        )}
        
        {(user.role === "host" || user.role === "admin") && (
          <Link href="/host/approve">
            <a className={`flex flex-col items-center ${isPath("/host/approve") ? "text-primary-500" : "text-neutral-500"}`}>
              <ClipboardCheck className="h-6 w-6" />
              <span className="text-xs mt-1">Approve</span>
            </a>
          </Link>
        )}
        
        {(user.role === "guard" || user.role === "admin") && (
          <Link href="/guard/visitors">
            <a className={`flex flex-col items-center ${isPath("/guard/visitors") ? "text-primary-500" : "text-neutral-500"}`}>
              <Users className="h-6 w-6" />
              <span className="text-xs mt-1">Visitors</span>
            </a>
          </Link>
        )}
        
        {user.role === "admin" && (
          <Link href="/admin/settings">
            <a className={`flex flex-col items-center ${isPath("/admin/settings") ? "text-primary-500" : "text-neutral-500"}`}>
              <Settings className="h-6 w-6" />
              <span className="text-xs mt-1">Settings</span>
            </a>
          </Link>
        )}
      </div>
    </div>
  );
}
