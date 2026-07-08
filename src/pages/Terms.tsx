import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

const Terms = () => {
  return (
    <div className="min-h-screen bg-background text-foreground font-body">
      <Helmet>
        <title>Terms of Service — BRUChat</title>
        <meta name="description" content="BRUChat Terms of Service: usage terms, content ownership, and governing law of Rwanda." />
        <link rel="canonical" href="https://bru-msg.lovable.app/terms" />
      </Helmet>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-8">
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
        <h1 className="font-heading text-4xl md:text-5xl font-black mb-6">Terms of Service</h1>
        <p className="text-muted-foreground mb-8">Last updated: June 10, 2026</p>

        <div className="space-y-6 text-foreground/80 leading-relaxed">
          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">1. Acceptance</h2>
            <p>By creating an account or using BRUChat, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">2. Acceptable Use</h2>
            <p>You agree not to use BRUChat for unlawful activities, harassment, spam, hate speech, sharing illegal content, or attempting to disrupt the service. Violations may result in account suspension or termination.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">3. Account Responsibility</h2>
            <p>You are responsible for keeping your credentials secure and for all activity under your account.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">4. Content & Ownership</h2>
            <p>You retain ownership of the content you post. By posting, you grant BRUChat a non-exclusive license to host, display, and distribute that content as needed to operate the service. The BRUChat platform, source code, brand, and design are the intellectual property of Ineza Aime Bruno and may not be copied or redistributed without permission.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">5. Advertising</h2>
            <p>BRUChat displays ads via Google AdSense. By using the service you acknowledge that ads may appear alongside content.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">6. Disclaimer</h2>
            <p>BRUChat is provided "as is" without warranties of any kind. We are not liable for damages arising from use of the service.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">7. Governing Law</h2>
            <p>These Terms are governed by the laws of the <strong>Republic of Rwanda</strong>. Any disputes shall be resolved under the jurisdiction of Rwandan courts.</p>
          </section>

          <section>
            <h2 className="font-heading text-2xl font-bold mb-3 text-foreground">8. Contact</h2>
            <p>For questions about these Terms, email <a href="mailto:inezaimebrunos3a@gmail.com" className="text-primary hover:underline">inezaimebrunos3a@gmail.com</a>.</p>
          </section>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Terms;
