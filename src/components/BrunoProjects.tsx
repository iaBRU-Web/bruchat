const brunoProjects = [
  { name: "BRU Claude AI", url: "https://bru-claude.lovable.app", desc: "AI Assistant", emoji: "🤖", featured: true },
  { name: "Bruno GPT5", url: "https://bruno-gpt5.vercel.app", desc: "AI Assistant", emoji: "🧠", featured: false },
  { name: "BRU Kart", url: "https://bru-kart.vercel.app", desc: "Racing Game", emoji: "🏎️", featured: false },
  { name: "BRUFite", url: "https://brufite.vercel.app", desc: "Fitness App", emoji: "🥊", featured: false },
  { name: "Piano BRU", url: "https://piano-bru.vercel.app", desc: "Virtual Piano", emoji: "🎹", featured: false },
  { name: "BRU CV", url: "https://bru-cv.vercel.app", desc: "Portfolio", emoji: "💼", featured: false },
  { name: "GTA KGL", url: "https://gta-kgl.vercel.app", desc: "Kigali Explorer", emoji: "🏙️", featured: false },
];

const BrunoProjects = () => {
  return (
    <section className="px-6 py-16 max-w-5xl mx-auto w-full">
      <h2 className="font-heading text-xl font-bold text-foreground mb-6 text-center">
        More from Bruno
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {brunoProjects.map((p) => (
          <a
            key={p.name}
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`group bg-card border rounded-xl p-5 text-center hover:shadow-[0_0_20px_hsl(var(--bruchat-accent-glow)/0.15)] transition-all duration-300 ${
              p.featured
                ? "border-primary/50 col-span-2 sm:col-span-1 lg:col-span-2 relative overflow-hidden"
                : "border-border hover:border-primary/40"
            }`}
          >
            {p.featured && (
              <span className="absolute top-2 right-2 text-[9px] px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
                Try it now ✨
              </span>
            )}
            <span className="text-3xl mb-2 block">{p.emoji}</span>
            <p className="font-heading font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
              {p.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
          </a>
        ))}
      </div>

      {/* Our Friends */}
      <h2 className="font-heading text-xl font-bold text-foreground mb-6 text-center mt-16">
        Our Friends 🤝
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
        <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/40 transition-all">
          <img
            src="https://img.youtube.com/vi/oTqs80xS9KE/mqdefault.jpg"
            alt="Eazy Chop"
            className="w-full aspect-video object-cover"
            loading="lazy"
          />
          <div className="p-4">
            <p className="font-heading font-semibold text-foreground">Eazy Chop Muzik</p>
            <p className="text-xs text-muted-foreground mb-3">Rwandan music creator • 148k+ views</p>
            <div className="flex gap-2">
              <a
                href="https://youtube.com/channel/UCbj_88MfRErvm6baRPmK-DA?sub_confirmation=1"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-destructive text-destructive-foreground text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Subscribe
              </a>
              <a
                href="https://eazychannel.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 border border-border text-xs font-semibold rounded-full text-foreground hover:bg-muted transition-colors"
              >
                Watch
              </a>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-border rounded-xl p-6 flex flex-col items-center justify-center hover:border-primary/40 transition-all">
          <span className="text-4xl mb-3">🤖</span>
          <p className="font-heading font-semibold text-foreground">BRU Claude AI</p>
          <p className="text-xs text-muted-foreground mb-4">Chat with Bruno's personal AI assistant</p>
          <a
            href="https://bru-claude.lovable.app"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-full hover:opacity-90 transition-opacity"
          >
            Try it now ✨
          </a>
        </div>
      </div>
    </section>
  );
};

export default BrunoProjects;
