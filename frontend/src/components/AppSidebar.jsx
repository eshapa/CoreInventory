import { useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Building2,
  ArrowRightLeft,
  History,
  AlertTriangle,
  BarChart3,
  QrCode,
  User,
  LogOut,
  ChevronLeft,
  Box,
} from "lucide-react";

import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

// If "@/lib/utils" doesn't work, change it to "../lib/utils"
import { cn } from "../lib/utils";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Products", path: "/products", icon: Package },
  { title: "Warehouses", path: "/warehouses", icon: Building2 },
  { title: "Operations", path: "/operations", icon: ArrowRightLeft },
  { title: "Transactions", path: "/transactions", icon: History },
  { title: "Alerts", path: "/alerts", icon: AlertTriangle },
  { title: "Reports", path: "/reports", icon: BarChart3 },
  { title: "QR Scanner", path: "/scanner", icon: QrCode },
  { title: "Profile", path: "/profile", icon: User },
];

function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar flex flex-col z-50 transition-all duration-300 border-r border-sidebar-border",
        collapsed ? "w-[68px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <Box className="w-4 h-4 text-primary-foreground" />
        </div>

        {!collapsed && (
          <span className="text-sidebar-accent-foreground font-bold text-lg tracking-tight">
            CoreInventory
          </span>
        )}

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "ml-auto p-1 rounded-md text-sidebar-muted hover:text-sidebar-accent-foreground transition-colors",
            collapsed && "ml-0"
          )}
        >
          <ChevronLeft
            className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "sidebar-item w-full",
                isActive ? "sidebar-item-active" : "sidebar-item-inactive"
              )}
              title={collapsed ? item.title : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />

              {!collapsed && <span>{item.title}</span>}
            </button>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={handleLogout}
          className="sidebar-item sidebar-item-inactive w-full"
          title={collapsed ? "Logout" : undefined}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}

export default AppSidebar;