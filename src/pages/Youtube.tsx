import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Play, Zap, ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";
import AdSense from "@/components/AdSense";

const Youtube = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>YouTube hub — BRUChat</title>
        <meta name="description" content="Browse YouTube shorts and videos shared by the BRUChat community." />
        <link rel="canonical" href="https://bru-msg.lovable.app/youtube" />
        <meta property="og:url" content="https://bru-msg.lovable.app/youtube" />
        <meta property="og:title" content="YouTube hub — BRUChat" />
      </Helmet>
      <main id="main" className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => navigate(-1)} aria-label="Go back" className="p-2 -ml-2 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-5 w-5" aria-hidden="true" /></button>
        <h1 className="font-heading text-3xl font-bold text-foreground mt-3 mb-2">YouTube on BRUChat</h1>
        <p className="text-muted-foreground mb-8">Share and discover videos with the community.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => navigate("/youtube/shorts")} className="bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition group">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-3 group-hover:bg-red-500/20"><Zap className="h-6 w-6 text-red-500" aria-hidden="true" /></div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">Shorts</h2>
            <p className="text-sm text-muted-foreground">Vertical, scrollable, snackable. Tap + to share a YouTube short.</p>
          </button>
          <button onClick={() => navigate("/youtube/videos")} className="bg-card border border-border rounded-2xl p-6 text-left hover:border-primary transition group">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20"><Play className="h-6 w-6 text-primary" aria-hidden="true" /></div>
            <h2 className="font-heading text-xl font-bold text-foreground mb-1">Videos</h2>
            <p className="text-sm text-muted-foreground">Long-form videos. Add a URL with a title and search through everyone's submissions.</p>
          </button>
        </div>
        <AdSense />
      </main>
      <Footer />
    </div>
  );
};

export default Youtube;
