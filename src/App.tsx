import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import Messenger from "./pages/Messenger";
import People from "./pages/People";
import Notifications from "./pages/Notifications";
import SettingsPage from "./pages/Settings";
import UserProfile from "./pages/UserProfile";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanel";
import ResetPassword from "./pages/ResetPassword";
import Posts from "./pages/Posts";
import PostDetail from "./pages/PostDetail";
import Explore from "./pages/Explore";
import DiscoverGroups from "./pages/DiscoverGroups";
import Donate from "./pages/Donate";
import Apply from "./pages/Apply";
import Achievements from "./pages/Achievements";
import Reels from "./pages/Reels";
import Youtube from "./pages/Youtube";
import YoutubeShorts from "./pages/YoutubeShorts";
import YoutubeVideos from "./pages/YoutubeVideos";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";

const queryClient = new QueryClient();

const AuthNavigator = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;
    const publicPaths = ["/", "/login", "/signup", "/auth/callback", "/admin", "/reset-password"];
    const isPublic = publicPaths.some(p => location.pathname === p || location.pathname.startsWith("/admin") || location.pathname.startsWith("/post/"));

    if (user && (location.pathname === "/login" || location.pathname === "/signup")) {
      navigate("/app", { replace: true });
    }
  }, [user, loading, location.pathname, navigate]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AuthNavigator />
          <div className="dark">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/app" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
              <Route path="/app/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
              <Route path="/app/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/app/group/:groupId" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
              <Route path="/app/:conversationId" element={<ProtectedRoute><Messenger /></ProtectedRoute>} />
              <Route path="/user/:username" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
              <Route path="/posts" element={<ProtectedRoute><Posts /></ProtectedRoute>} />
              <Route path="/post/:postId" element={<PostDetail />} />
              <Route path="/explore" element={<ProtectedRoute><Explore /></ProtectedRoute>} />
              <Route path="/discover-groups" element={<ProtectedRoute><DiscoverGroups /></ProtectedRoute>} />
              <Route path="/donate" element={<Donate />} />
              <Route path="/apply" element={<ProtectedRoute><Apply /></ProtectedRoute>} />
              <Route path="/achievements" element={<ProtectedRoute><Achievements /></ProtectedRoute>} />
              <Route path="/reel" element={<ProtectedRoute><Reels /></ProtectedRoute>} />
              <Route path="/youtube" element={<Youtube />} />
              <Route path="/youtube/shorts" element={<ProtectedRoute><YoutubeShorts /></ProtectedRoute>} />
              <Route path="/youtube/videos" element={<ProtectedRoute><YoutubeVideos /></ProtectedRoute>} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="/admin" element={<AdminLogin />} />
              <Route path=".lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
              <Route path="/admin/panel" element={<AdminPanel />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
