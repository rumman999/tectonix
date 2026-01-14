import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Activity } from "lucide-react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string; // Optional: Displays "Dashboard" or "Rescue Ops" in the mobile header
}

export const DashboardLayout = ({ children, title }: DashboardLayoutProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      
      {/* --- DESKTOP: Fixed Sidebar (Hidden on Mobile) --- */}
      <div className="hidden md:block fixed inset-y-0 left-0 z-50 w-64 border-r bg-sidebar">
        <DashboardSidebar />
      </div>

      {/* --- MAIN CONTENT AREA --- */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative">
        
        {/* MOBILE HEADER (Visible only on small screens) */}
        <header className="md:hidden sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur-md px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-lg">
                <Activity className="text-primary h-5 w-5" />
                <span>{title || "Tectonix"}</span>
            </div>

            {/* HAMBURGER MENU */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                
                {/* DRAWER CONTENT */}
                <SheetContent side="left" className="p-0 w-64 border-r [&>button]:hidden">
                    <SheetTitle className="hidden">Navigation</SheetTitle>
                    <DashboardSidebar onLinkClick={() => setIsMobileMenuOpen(false)} />
                </SheetContent>
            </Sheet>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            {children}
        </main>
      </div>
    </div>
  );
};