import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    // Log the attempted path for debugging purposes
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        {/* Visual Icon */}
        <div className="w-20 h-20 rounded-3xl bg-muted flex items-center justify-center mx-auto mb-6">
          <FileQuestion className="w-10 h-10 text-muted-foreground" />
        </div>

        <h1 className="mb-2 text-6xl font-extrabold tracking-tight text-primary">
          404
        </h1>
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Page not found
        </h2>
        <p className="mb-8 text-muted-foreground">
          Sorry, we couldn't find the page you're looking for. It might have been
          moved or deleted.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button asChild variant="default" className="w-full sm:w-auto gap-2">
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Return to Home
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full sm:w-auto">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;