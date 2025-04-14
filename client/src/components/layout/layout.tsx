import { useState, ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { AuthProvider } from "@/lib/auth";

interface LayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };
  
  return (
    <AuthProvider>
      <div className="h-screen flex overflow-hidden bg-background">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-20">
            <div 
              className="absolute inset-0 bg-black opacity-50"
              onClick={toggleSidebar}
            ></div>
            <div className="absolute inset-y-0 left-0 w-64 bg-white z-30">
              <Sidebar />
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onToggleSidebar={toggleSidebar} title={title} subtitle={subtitle} />
          
          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto bg-neutral-50 p-4 md:p-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
          
          {/* Mobile Bottom Navigation */}
          <MobileNav />
        </div>
      </div>
    </AuthProvider>
  );
}
