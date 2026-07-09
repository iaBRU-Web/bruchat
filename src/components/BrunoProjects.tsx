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
    </section>
  );
};

export default BrunoProjects;
