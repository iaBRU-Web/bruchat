import { BadgeCheck, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const PROMO_END = new Date("2026-07-01T00:00:00Z");

const PromoBanner = () => {
  const now = new Date();
  if (now > PROMO_END) return null;

  const daysLeft = Math.ceil((PROMO_END.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="w-full bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 border-y border-primary/30">
      <div className="max-w-5xl mx-auto px-6 py-3 flex flex-wrap items-center justify-center gap-3 text-center">
        <Sparkles className="h-5 w-5 text-primary flex-shrink-0 animate-pulse" />
        <p className="text-sm md:text-base text-foreground font-medium">
          <span className="font-bold text-primary">Limited Promo!</span>{" "}
          Sign up or log in within the next {daysLeft} days and get a
          <BadgeCheck className="inline h-4 w-4 mx-1 text-blue-500" />
          <span className="font-semibold">free verified badge</span> — no application needed!
        </p>
        <Link
          to="/signup"
          className="text-xs md:text-sm px-3 py-1 rounded-full bg-primary text-primary-foreground font-semibold hover:opacity-90 transition"
        >
          Claim Now
        </Link>
      </div>
    </div>
  );
};

export default PromoBanner;
