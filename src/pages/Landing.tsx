import { useEffect, useRef, useState } from "react";
import { Shield, Users, Mic, Zap, ArrowRight, MessageCircle, Lock, Globe, Smartphone, ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BrunoProjects from "@/components/BrunoProjects";
import Footer from "@/components/Footer";

const features = [
  { icon: Shield, title: "End-to-End Encrypted", desc: "Private messages only you and your contact can read. Security by design." },
  { icon: Users, title: "Group Chats", desc: "Create high-energy groups with up to 500 members. No lag, just vibes." },
  { icon: Mic, title: "Voice Messages", desc: "Crystal clear audio recording and instant playback across all devices." },
  { icon: Zap, title: "Real-Time", desc: "Instant delivery with zero latency. Always in sync, always connected." },
];

const highlights = [
  { icon: Lock, label: "Encrypted", desc: "Zero-access encryption" },
  { icon: Globe, label: "Global", desc: "Connect worldwide" },
  { icon: Smartphone, label: "Cross-Platform", desc: "Mobile & desktop" },
  { icon: MessageCircle, label: "Social", desc: "Posts, reels & chat" },
];

function AnimatedOrbs() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden -z-10">
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#00d4ff]/8 blur-[100px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#7c3aed]/10 blur-[120px] animate-pulse" style={{ animationDelay: "1.5s" }} />
      <div className="absolute top-[40%] left-[60%] w-[300px] h-[300px] rounded-full bg-[#00d4ff]/6 blur-[80px] animate-pulse" style={{ animationDelay: "3s" }} />
    </div>
  );
}

function useCountUp(end: number, duration = 2000) {
  const [count, setCount] = useState(1);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          let start = 1;
          const step = (timestamp: number) => {
            const progress = Math.min((timestamp - start) / duration, 1);
            setCount(Math.floor(progress * end));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return { count, ref };
}

function Stat({ end, suffix, label }: { end: number; suffix: string; label: string }) {
  const { count, ref } = useCountUp(end);
  return (
    <div ref={ref} className="text-center">
      <div className="font-heading text-4xl md:text-5xl font-black text-white mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-sm text-white/50 uppercase tracking-widest font-bold">{label}</div>
    </div>
  );
}

function AppMockup() {
  return (
    <div className="relative mx-auto w-full max-w-[320px] md:max-w-[380px]">
      {/* Phone frame */}
      <div className="relative rounded-[2.5rem] border-[6px] border-white/10 bg-[#0a0f1e] p-3 shadow-2xl shadow-[#00d4ff]/10">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-[#0a0f1e] rounded-b-xl z-10" />
        {/* Screen content */}
        <div className="rounded-[2rem] bg-[#0f172a] overflow-hidden aspect-[9/19]">
          {/* Header */}
          <div className="bg-[#0f172a]/95 backdrop-blur px-4 py-3 border-b border-white/5 flex items-center gap-3 pt-6">
            <div className="w-9 h-9 rounded-full bg-[#00d4ff]/20 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-[#00d4ff]" />
            </div>
            <div className="flex-1">
              <div className="text-white text-sm font-bold">BRUChat</div>
              <div className="text-[#00d4ff] text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
                online
              </div>
            </div>
          </div>
          {/* Chat bubbles */}
          <div className="p-3 space-y-3">
            <div className="flex justify-end">
              <div className="bg-[#00d4ff] text-[#020617] rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] font-medium max-w-[80%]">
                Hey! Just joined BRUChat 🔥
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] font-medium max-w-[80%]">
                Welcome! The vibes here are unmatched ✨
              </div>
            </div>
            <div className="flex justify-end">
              <div className="bg-[#00d4ff] text-[#020617] rounded-2xl rounded-tr-sm px-3 py-2 text-[11px] font-medium max-w-[80%]">
                Love the encrypted privacy!
              </div>
            </div>
            <div className="flex justify-start">
              <div className="bg-white/10 text-white rounded-2xl rounded-tl-sm px-3 py-2 text-[11px] font-medium max-w-[80%]">
                Groups, voice notes, posts — all in one place
              </div>
            </div>
            {/* Voice note */}
            <div className="flex justify-end">
              <div className="bg-[#00d4ff]/20 border border-[#00d4ff]/30 rounded-2xl rounded-tr-sm px-3 py-2 flex items-center gap-2 max-w-[80%]">
                <div className="flex gap-0.5 items-end h-3">
                  {[3,6,4,7,5,8,4,6].map((h,i)=>(
                    <div key={i} className="w-[2px] bg-[#00d4ff] rounded-full animate-pulse" style={{height:`${h*2}px`,animationDelay:`${i*0.1}s`}} />
                  ))}
                </div>
                <span className="text-[#00d4ff] text-[10px] font-bold">0:24</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Glow behind phone */}
      <div className="absolute -inset-8 bg-[#00d4ff]/5 blur-[60px] rounded-full -z-10" />
    </div>
  );
}

const Landing = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[#020617] text-[#f8fafc] font-body selection:bg-[#00d4ff]/30 flex flex-col overflow-x-hidden">
      <Helmet>
        <title>BRUChat — Private Encrypted Messenger</title>
        <meta name="description" content="BRUChat: private encrypted messenger with group chats, voice notes, posts, reels & YouTube. Made in Kigali by INEZA AIME BRUNO." />
        <link rel="canonical" href="https://bru-msg.lovable.app/" />
        <meta property="og:url" content="https://bru-msg.lovable.app/" />
        <meta property="og:title" content="BRUChat — Private Encrypted Messenger" />
        <meta property="og:description" content="Private encrypted chats, groups, voice notes, posts, reels & YouTube." />
      </Helmet>

      {/* Nav */}
      <nav className={`fixed top-0 left-1/2 -translate-x-1/2 z-50 w-full max-w-7xl px-6 transition-all duration-500 ${scrolled ? "top-4" : "top-0"}`}>
        <div className={`flex items-center justify-between py-4 px-6 rounded-full transition-all duration-500 ${scrolled ? "bg-[#0f172a]/80 backdrop-blur-xl border border-white/10 shadow-xl" : ""}`}>
          <div className="font-heading font-black text-xl tracking-tight">
            BRU<span className="text-[#00d4ff]">Chat</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-bold text-white/70 hover:text-white transition-colors">Log In</Link>
            <Link to="/signup" className="text-sm font-bold px-5 py-2 bg-[#00d4ff] text-[#020617] rounded-full hover:shadow-[0_0_20px_-5px_#00d4ff] transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <AnimatedOrbs />

      <main id="main" className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="relative pt-32 pb-20 px-6">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-8 animate-fade-in backdrop-blur">
                <div className="w-2 h-2 rounded-full bg-[#00d4ff] animate-pulse" />
                <span className="text-xs font-bold uppercase tracking-widest text-white/60">The Future of Chat</span>
              </div>

              <h1 className="font-heading font-black text-5xl md:text-7xl lg:text-[5rem] leading-[0.95] tracking-tighter mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-white/50">
                  BRUChat
                </span>
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] to-[#7c3aed]">
                  Private Messenger
                </span>
              </h1>

              <p className="font-heading text-xl md:text-2xl text-[#00d4ff] font-bold mb-6 tracking-wide">
                Talk. Share. Vibe.
              </p>

              <p className="max-w-lg mx-auto lg:mx-0 text-lg text-white/50 mb-10 leading-relaxed">
                Private encrypted chats, group conversations, voice messages, social posts & reels — a messenger built for real connections without the noise.
              </p>

              <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
                <Link
                  to="/signup"
                  className="group px-10 py-4 bg-[#00d4ff] text-[#020617] rounded-full font-bold text-lg hover:shadow-[0_0_40px_-10px_#00d4ff] hover:scale-105 transition-all flex items-center gap-2"
                >
                  Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Link>
                <Link
                  to="/login"
                  className="px-10 py-4 border border-white/20 rounded-full font-bold text-lg hover:bg-white/5 transition-all backdrop-blur"
                >
                  Log In
                </Link>
              </div>

              {/* Highlight pills */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-3">
                {highlights.map((h) => (
                  <div key={h.label} className="flex items-center gap-2 px-3 py-2 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-white/60">
                    <h.icon className="w-3.5 h-3.5 text-[#00d4ff]" />
                    {h.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <AppMockup />
            </div>
          </div>

          {/* Scroll indicator */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/30 animate-bounce">
            <span className="text-[10px] font-bold uppercase tracking-widest">Scroll</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </section>

        {/* Stats strip */}
        <section className="border-y border-white/5 bg-white/[0.02] backdrop-blur">
          <div className="max-w-5xl mx-auto px-6 py-14 grid grid-cols-2 md:grid-cols-4 gap-8">
            <Stat end={5000} suffix="+" label="Messages daily" />
            <Stat end={500} suffix="+" label="Active groups" />
            <Stat end={99} suffix=".9%" label="Uptime" />
            <Stat end={0} suffix="" label="Data leaks" />
          </div>
        </section>

        {/* Features */}
        <section className="max-w-7xl mx-auto px-6 py-24 w-full" aria-labelledby="features-heading">
          <div className="text-center mb-20">
            <h2 id="features-heading" className="font-heading text-4xl md:text-5xl font-black mb-5">Why BRUChat</h2>
            <p className="text-white/40 max-w-xl mx-auto">Everything you need to stay connected, private, and in control.</p>
            <div className="w-16 h-1.5 bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] mx-auto mt-6 rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group relative p-8 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-[#00d4ff]/40 hover:bg-white/[0.06] transition-all duration-500 overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-[#00d4ff]/5 rounded-full blur-[50px] group-hover:bg-[#00d4ff]/10 transition-all" />
                <div className="w-14 h-14 rounded-2xl bg-[#00d4ff]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                  <f.icon className="w-7 h-7 text-[#00d4ff]" aria-hidden="true" />
                </div>
                <h3 className="font-heading text-xl font-bold mb-3 text-white">{f.title}</h3>
                <p className="text-white/40 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-20">
            <h2 className="font-heading text-4xl md:text-5xl font-black mb-5">How It Works</h2>
            <div className="w-16 h-1.5 bg-gradient-to-r from-[#00d4ff] to-[#7c3aed] mx-auto rounded-full" />
          </div>

          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-[3.5rem] left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-[#00d4ff]/0 via-[#00d4ff]/30 to-[#00d4ff]/0" />

            {[
              { step: "01", title: "Sign Up", desc: "Create your account in seconds. No phone number required." },
              { step: "02", title: "Connect", desc: "Find friends, join groups, or invite your circle." },
              { step: "03", title: "Chat Free", desc: "Send messages, voice notes, posts, and reels. All encrypted." },
            ].map((item) => (
              <div key={item.step} className="text-center relative">
                <div className="w-16 h-16 rounded-full bg-[#00d4ff]/10 border border-[#00d4ff]/30 flex items-center justify-center mx-auto mb-6 backdrop-blur">
                  <span className="font-heading font-black text-xl text-[#00d4ff]">{item.step}</span>
                </div>
                <h3 className="font-heading text-2xl font-bold mb-3">{item.title}</h3>
                <p className="text-white/40 text-sm max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative px-6 py-28 overflow-hidden">
          <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl aspect-square bg-[#00d4ff]/8 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-3xl mx-auto text-center relative">
            <h2 className="font-heading text-4xl md:text-6xl font-black mb-6">
              Ready to <span className="text-[#00d4ff]">Vibe</span>?
            </h2>
            <p className="text-white/50 text-lg mb-10 max-w-lg mx-auto">
              Join the private messenger made in Kigali. No ads. No tracking. Just real conversations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link
                to="/signup"
                className="group px-10 py-4 bg-[#00d4ff] text-[#020617] rounded-full font-bold text-lg hover:shadow-[0_0_40px_-10px_#00d4ff] hover:scale-105 transition-all flex items-center gap-2"
              >
                Get Started <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
              </Link>
              <Link
                to="/login"
                className="px-10 py-4 border border-white/20 rounded-full font-bold text-lg hover:bg-white/5 transition-all"
              >
                Log In
              </Link>
            </div>
          </div>
        </section>
      </main>

      <BrunoProjects />
      <Footer />

      {/* Floating AI button */}
      <a
        href="https://bru-claude.lovable.app"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 pl-4 pr-6 py-3 bg-[#00d4ff] text-[#020617] rounded-full font-bold shadow-2xl hover:scale-105 transition-all"
      >
        <span className="text-xl">🤖</span>
        <span className="hidden sm:inline">Chat with AI</span>
      </a>
    </div>
  );
};

export default Landing;
