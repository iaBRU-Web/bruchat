import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useEffect, useRef } from "react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile, loading } = useAuth();
  const toastShown = useRef(false);

  useEffect(() => {
    if (!loading && loading === false && !toastShown.current) {
      // Check if we just exceeded loading timeout
    }
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-breathe text-primary text-xl font-heading">BRUChat</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.is_banned) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="bg-card border border-destructive/50 rounded-2xl p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🚫</div>
          <h2 className="font-heading text-xl font-bold text-foreground mb-2">Account Suspended</h2>
          <p className="text-muted-foreground">Your account has been suspended. Contact Bruno if you think this is a mistake.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
