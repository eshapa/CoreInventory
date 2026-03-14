import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import DashboardHeader from "./DashboardHeader";

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background">
      
      <AppSidebar />

      <div className="ml-[240px] transition-all duration-300">
        
        <DashboardHeader />

        <main className="p-6">
          <Outlet />
        </main>

      </div>

    </div>
  );
}

export default DashboardLayout;