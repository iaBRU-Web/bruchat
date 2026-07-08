import { useState, useEffect } from "react";
import { BadgeCheck, Send, CheckCircle, Clock, XCircle, ChevronRight, ChevronLeft, Users, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import AppSidebar from "@/components/chat/AppSidebar";

const STEPS = [
  "Eligibility Check",
  "Full Name",
  "Username Confirmation",
  "Category",
  "Bio / About You",
  "Social Media Links",
  "Notable Work",
  "Why Verification?",
  "Acknowledgement",
  "Submit",
];

const CATEGORIES = [
  "Content Creator",
  "Public Figure",
  "Brand / Business",
  "Journalist / Media",
  "Developer / Tech",
  "Artist / Musician",
  "Educator",
  "Other",
];

const Apply = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [existingRequest, setExistingRequest] = useState<{ status: string; created_at: string } | null>(null);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  // Form fields
  const [fullName, setFullName] = useState("");
  const [category, setCategory] = useState("");
  const [bioText, setBioText] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [notableWork, setNotableWork] = useState("");
  const [reason, setReason] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchStatus = async () => {
      const [{ data: verified }, { data: req }, { count }] = await Promise.all([
        supabase.from("verified_users").select("id").eq("user_id", user.id).maybeSingle(),
        supabase.from("verification_requests").select("status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
        supabase.from("follows").select("id", { count: "exact", head: true }).eq("following_id", user.id),
      ]);
      if (verified) { setIsAlreadyVerified(true); return; }
      if (req) setExistingRequest(req);
      setFollowerCount(count ?? 0);
    };
    fetchStatus();
  }, [user]);

  const canProceedStep = (): boolean => {
    switch (step) {
      case 0: return (followerCount ?? 0) >= 40;
      case 1: return fullName.trim().length >= 2;
      case 2: return true; // username confirmed
      case 3: return category !== "";
      case 4: return bioText.trim().length >= 20;
      case 5: return socialLinks.trim().length >= 5;
      case 6: return notableWork.trim().length >= 10;
      case 7: return reason.trim().length >= 10;
      case 8: return acknowledged;
      case 9: return true;
      default: return false;
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("verification_requests").insert({
      user_id: user.id,
      reason: reason.trim(),
      full_name: fullName.trim(),
      bio_text: bioText.trim(),
      social_links: socialLinks.trim(),
      category,
      notable_work: notableWork.trim(),
      follower_count_at_apply: followerCount ?? 0,
      step_completed: 10,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Failed to submit request", variant: "destructive" });
      return;
    }
    toast({ title: "Verification request submitted! ✅" });
    setExistingRequest({ status: "pending", created_at: new Date().toISOString() });
  };

  const statusIcon: Record<string, JSX.Element> = {
    pending: <Clock className="h-5 w-5 text-yellow-400" />,
    approved: <CheckCircle className="h-5 w-5 text-green-400" />,
    rejected: <XCircle className="h-5 w-5 text-red-400" />,
  };

  const renderStepContent = () => {
    switch (step) {
      case 0:
        return (
          <div className="text-center space-y-4">
            <Users className="h-10 w-10 text-primary mx-auto" />
            <h3 className="font-heading font-bold text-foreground">Eligibility Check</h3>
            <p className="text-sm text-muted-foreground">You need at least <span className="text-primary font-bold">40 followers</span> to apply for verification.</p>
            <div className="bg-muted/30 rounded-2xl p-4">
              <p className="text-3xl font-bold text-foreground">{followerCount ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Your current followers</p>
            </div>
            {(followerCount ?? 0) < 40 && (
              <div className="bg-destructive/10 text-destructive rounded-xl p-3 text-sm">
                <Lock className="h-4 w-4 inline mr-1" />
                You need {40 - (followerCount ?? 0)} more followers to apply.
              </div>
            )}
            {(followerCount ?? 0) >= 40 && (
              <div className="bg-green-500/10 text-green-500 rounded-xl p-3 text-sm">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                You're eligible! Continue to the next step.
              </div>
            )}
          </div>
        );
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">What's your full name?</h3>
            <p className="text-sm text-muted-foreground">This should match your real identity or brand name.</p>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name" className="rounded-2xl" maxLength={100} />
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Confirm your username</h3>
            <p className="text-sm text-muted-foreground">The verified badge will appear next to this username.</p>
            <div className="bg-muted/30 rounded-2xl p-4 text-center">
              <p className="text-xl font-bold text-foreground">@{user?.user_metadata?.username || "you"}</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Select your category</h3>
            <p className="text-sm text-muted-foreground">What best describes you?</p>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className={`p-3 rounded-xl text-sm border transition-colors ${category === cat ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground hover:text-foreground"}`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Tell us about yourself</h3>
            <p className="text-sm text-muted-foreground">Write a brief bio (min 20 characters).</p>
            <Textarea value={bioText} onChange={e => setBioText(e.target.value)} placeholder="About you..." className="min-h-[100px] rounded-2xl" maxLength={500} />
            <p className="text-xs text-muted-foreground text-right">{bioText.length}/500</p>
          </div>
        );
      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Social media links</h3>
            <p className="text-sm text-muted-foreground">Share links to your other social profiles (Instagram, Twitter, YouTube, etc.).</p>
            <Textarea value={socialLinks} onChange={e => setSocialLinks(e.target.value)} placeholder="https://instagram.com/yourname&#10;https://twitter.com/yourname" className="min-h-[100px] rounded-2xl" maxLength={1000} />
          </div>
        );
      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Notable work or achievements</h3>
            <p className="text-sm text-muted-foreground">What are you known for? Articles, projects, brands, etc.</p>
            <Textarea value={notableWork} onChange={e => setNotableWork(e.target.value)} placeholder="Describe your notable work..." className="min-h-[100px] rounded-2xl" maxLength={500} />
          </div>
        );
      case 7:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Why should you be verified?</h3>
            <p className="text-sm text-muted-foreground">Tell us why verification matters for your account (min 10 characters).</p>
            <Textarea value={reason} onChange={e => setReason(e.target.value)} placeholder="Your reason for verification..." className="min-h-[120px] rounded-2xl" maxLength={500} />
            <p className="text-xs text-muted-foreground text-right">{reason.length}/500</p>
          </div>
        );
      case 8:
        return (
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-foreground">Acknowledgement</h3>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 text-sm text-muted-foreground">
              <p>By submitting this application, you acknowledge that:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>All information provided is truthful and accurate</li>
                <li>The admin team will review your application</li>
                <li>Verification can be revoked if you violate community guidelines</li>
                <li>The badge type (true or standard) is at the admin's discretion</li>
                <li>Processing may take several days</li>
              </ul>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={acknowledged} onChange={e => setAcknowledged(e.target.checked)} className="rounded accent-primary w-5 h-5" />
              <span className="text-sm text-foreground">I understand and agree</span>
            </label>
          </div>
        );
      case 9:
        return (
          <div className="text-center space-y-4">
            <BadgeCheck className="h-12 w-12 text-blue-500 mx-auto" />
            <h3 className="font-heading font-bold text-foreground">Ready to submit!</h3>
            <p className="text-sm text-muted-foreground">Review your application:</p>
            <div className="bg-card border border-border rounded-2xl p-4 text-left space-y-2 text-sm">
              <p><span className="text-muted-foreground">Name:</span> <span className="text-foreground">{fullName}</span></p>
              <p><span className="text-muted-foreground">Category:</span> <span className="text-foreground">{category}</span></p>
              <p><span className="text-muted-foreground">Followers:</span> <span className="text-foreground">{followerCount}</span></p>
              <p><span className="text-muted-foreground">Reason:</span> <span className="text-foreground">{reason.slice(0, 80)}...</span></p>
            </div>
            <Button onClick={handleSubmit} disabled={loading} className="w-full rounded-2xl">
              <Send className="h-4 w-4 mr-2" />
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </div>
        );
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      <div className="hidden md:flex"><AppSidebar /></div>
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="font-heading text-2xl font-bold text-foreground">Apply for Verification</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Complete all 10 steps to submit your verification application.
            </p>
          </div>

          {isAlreadyVerified ? (
            <div className="text-center p-6 bg-card border border-border rounded-2xl">
              <BadgeCheck className="h-10 w-10 text-blue-500 mx-auto mb-3" />
              <p className="text-foreground font-medium">You're already verified! 🎉</p>
            </div>
          ) : existingRequest?.status === "pending" ? (
            <div className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                {statusIcon.pending}
                <span className="text-foreground font-medium">Request Pending</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your verification request is being reviewed. We'll update your status soon.
              </p>
            </div>
          ) : existingRequest?.status === "approved" ? (
            <div className="p-6 bg-card border border-border rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                {statusIcon.approved}
                <span className="text-foreground font-medium">Approved!</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Congratulations! Your verification has been approved.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {existingRequest?.status === "rejected" && (
                <div className="p-4 bg-card border border-red-500/20 rounded-2xl">
                  <div className="flex items-center gap-3 mb-1">
                    {statusIcon.rejected}
                    <span className="text-foreground font-medium">Previous request rejected</span>
                  </div>
                  <p className="text-sm text-muted-foreground">You can submit a new request below.</p>
                </div>
              )}

              {/* Progress bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Step {step + 1} of {STEPS.length}</span>
                  <span>{STEPS[step]}</span>
                </div>
                <Progress value={(step + 1) / STEPS.length * 100} className="h-2" />
              </div>

              {/* Step indicators */}
              <div className="flex gap-1 justify-center">
                {STEPS.map((_, i) => (
                  <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>

              {/* Step content */}
              <div className="bg-card border border-border rounded-2xl p-6">
                {renderStepContent()}
              </div>

              {/* Navigation */}
              {step < 9 && (
                <div className="flex gap-3">
                  {step > 0 && (
                    <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 rounded-2xl">
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button onClick={() => setStep(s => s + 1)} disabled={!canProceedStep()} className="flex-1 rounded-2xl">
                    Next <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
              {step === 9 && step > 0 && (
                <Button variant="outline" onClick={() => setStep(s => s - 1)} className="w-full rounded-2xl">
                  <ChevronLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              )}
            </div>
          )}
        </div>
        <Footer />
      </div>
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50">
        <AppSidebar mobile />
      </div>
    </div>
  );
};

export default Apply;
