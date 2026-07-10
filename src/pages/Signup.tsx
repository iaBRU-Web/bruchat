import { useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Eye, EyeOff, MessageCircle, Mail, Lock, User, ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import BrunoProjects from "@/components/BrunoProjects";
import Footer from "@/components/Footer";

const getStrength = (pw: string) => {
  const len = pw.length;
  if (len === 0) return { label: "", color: "", percent: 0 };
  if (len < 6) return { label: "Too short", color: "bg-destructive", percent: 20 };
  if (len < 10) return { label: "Okay", color: "bg-orange-500", percent: 40 };
  if (len < 15) return { label: "Good", color: "bg-yellow-500", percent: 70 };
  return { label: "Strong 💪", color: "bg-bruchat-online", percent: 100 };
};

const sanitize = (text: string) => text.replace(/<[^>]*>/g, "").trim();

const Signup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get("next") || "";
  const nextPath = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/app";
  const redirectBackUrl = `${window.location.origin}${nextPath}`;
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => getStrength(password), [password]);
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectBackUrl,
      }
    });
    
    if (error) {
      setError("Something went wrong with sign in. Try again or use email 😅");
      setGoogleLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = sanitize(username);
    if (cleanUsername.length < 3) {
      setError("Username must be at least 3 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match. Double-check!");
      return;
    }
    if (password.length < 6) {
      setError("Come on, at least 6 characters — we believe in you 💪");
      return;
    }

    setLoading(true);
    setError("");

    // Check username availability
    const { data: existingUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", cleanUsername.toLowerCase())
      .single();

    if (existingUser) {
      setError("That username is taken. Try another one!");
      setLoading(false);
      return;
    }

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectBackUrl,
        data: {
          user_name: cleanUsername.toLowerCase(),
          full_name: cleanUsername,
        },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // Auto-confirm is enabled, so user should be signed in immediately
    // The handle_new_user trigger creates the profile automatically
    // Navigate to app right away
    if (signUpData?.user) {
      const newUserId = signUpData.user.id;
      // Update the profile with the chosen username
      setTimeout(async () => {
        await supabase
          .from("profiles")
          .update({
            username: cleanUsername.toLowerCase(),
            display_name: cleanUsername,
          })
          .eq("id", newUserId);
      }, 500);


      navigate(nextPath, { replace: true });
    } else {
      setLoading(false);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Helmet>
        <title>Create your BRUChat account</title>
        <meta name="description" content="Sign up for BRUChat — free, private messaging with groups, voice notes, posts and reels." />
        <link rel="canonical" href="https://bruchat.vercel.app/signup" />
        <meta property="og:url" content="https://bruchat.vercel.app/signup" />
        <meta property="og:title" content="Create your BRUChat account" />
      </Helmet>
      <main id="main" className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center gap-2 mb-8">
            <MessageCircle className="h-8 w-8 text-primary animate-breathe" aria-hidden="true" />
            <span className="text-3xl font-heading font-extrabold text-foreground">
              BRU<span className="text-primary">Chat</span>
            </span>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8">
            <h1 className="font-heading text-2xl font-bold text-foreground mb-1 text-center">Create account</h1>
            <p className="text-sm text-muted-foreground mb-6 text-center">Join BRUChat and start vibing</p>

            {/* OAuth */}
            <div className="space-y-3 mb-6">
              <Button
                variant="outline"
                className="w-full h-11 rounded-pill"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
              >
                {googleLoading ? (
                  <span className="animate-spin mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full inline-block" />
                ) : (
                  <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="text"
                  id="signup-username"
                  aria-label="Username"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
                  className="pl-10 rounded-pill"
                  required
                  maxLength={20}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type="email"
                  id="signup-email"
                  aria-label="Email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-pill"
                  required
                />
              </div>

              <div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    id="signup-password"
                    aria-label="Password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 rounded-pill"
                    required
                    maxLength={100}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${strength.percent}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <Input
                  type={showConfirm ? "text" : "password"}
                  id="signup-confirm-password"
                  aria-label="Confirm password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 rounded-pill"
                  required
                  maxLength={100}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {passwordsMatch && <Check className="h-4 w-4 text-bruchat-online" />}
                  {passwordsMismatch && <X className="h-4 w-4 text-destructive" />}
                  <button
                    type="button"
                    aria-label={showConfirm ? "Hide confirmation password" : "Show confirmation password"}
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="text-sm text-destructive text-center animate-slide-up-fade">{error}</p>
              )}

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Sign Up"}
                {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
              </Button>
            </form>

            <p className="text-sm text-muted-foreground text-center mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </main>

      <BrunoProjects />
      <Footer />
    </div>
  );
};

export default Signup;
