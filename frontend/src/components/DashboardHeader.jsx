import { Search, Bell, Plus } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";

function DashboardHeader() {
  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 sticky top-0 z-40">
      
      {/* Search */}
      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

        <Input
          placeholder="Search products, warehouses..."
          className="pl-10 bg-secondary/50 border-0 focus-visible:ring-1"
        />
      </div>

      {/* Right section */}
      <div className="flex items-center gap-3">

        <Button variant="default" size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Quick Action
        </Button>

        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full" />
        </button>

        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
          JS
        </div>

      </div>

    </header>
  );
}

export default DashboardHeader;