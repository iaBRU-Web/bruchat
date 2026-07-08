import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Mail, MessageCircle } from "lucide-react";
import Footer from "@/components/Footer";

const About = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>About & Contact — BRUChat</title>
        <meta name="description" content="About BRUChat — built by Ineza Aime Bruno in Kigali, Rwanda. Get in touch." />
        <link rel="canonical" href="https://bru-msg.lovable.app/about" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="font-heading text-4xl md:text-5xl font-black mb-6">About BRUChat</h1>

        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <section>
            <p>BRUChat is a private messenger and social platform built for real connections — chats, group conversations, voice notes, posts, and reels in one place. No noise, no tracking-for-tracking's-sake, just good vibes.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">The Creator</h2>
            <p>BRUChat was designed and built by <strong>Ineza Aime Bruno</strong>, a developer based in Kigali, Rwanda. The project is independently maintained and continually improved.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">Contact</h2>
            <div className="space-y-3">
              <a href="mailto:inezaimebrunos3a@gmail.com" className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
                <Mail className="h-5 w-5 text-primary" />
                <span className="font-medium">inezaimebrunos3a@gmail.com</span>
              </a>
              <Link to="/user/bruchat" className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary transition-colors">
                <MessageCircle className="h-5 w-5 text-primary" />
                <span className="font-medium">Message @bruchat in-app</span>
              </Link>
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default About;
