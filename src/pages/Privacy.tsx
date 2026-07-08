import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>Privacy Policy — BRUChat</title>
        <meta name="description" content="BRUChat Privacy Policy: how we handle your data and use Google AdSense cookies for personalized ads." />
        <link rel="canonical" href="https://bru-msg.lovable.app/privacy" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="font-heading text-4xl md:text-5xl font-black mb-6">Privacy Policy</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 10, 2026</p>

        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">1. Your Data</h2>
            <p>BRUChat respects your privacy. We collect only the information needed to operate the service: your account details (email, username), profile information you choose to share, messages you send, and content you post. Messages are stored on our secure backend and are visible only to you and the recipients.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">2. Data Safety</h2>
            <p>We use industry-standard security practices including encrypted database connections, Row-Level Security policies, and authenticated storage. We never sell your personal data to third parties.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">3. Google AdSense & Cookies</h2>
            <p>BRUChat uses Google AdSense to display ads. <strong>Google AdSense uses third-party cookies to serve personalized ads based on user visits</strong> to this site and other websites on the internet. You may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Google Ads Settings</a>.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">4. Your Rights</h2>
            <p>You can edit, export, or delete your account at any time from the Settings page. Contact us if you need help removing your data.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">5. Contact</h2>
            <p>For privacy questions, email <a href="mailto:inezaimebrunos3a@gmail.com" className="text-primary hover:underline">inezaimebrunos3a@gmail.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Privacy;
