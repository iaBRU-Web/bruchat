interface ProfileCompletenessProps {
  profile: any;
  postCount: number;
  followerCount: number;
}

const ProfileCompleteness = ({ profile, postCount, followerCount }: ProfileCompletenessProps) => {
  let score = 0;
  if (profile.avatar_url) score += 20;
  if (profile.display_name && profile.display_name !== "") score += 10;
  if (profile.bio) score += 20;
  if (profile.status_text) score += 10;
  if (profile.banner_url && !profile.banner_url.startsWith("linear-gradient") && profile.banner_url !== "") score += 15;
  else if (profile.banner_url && profile.banner_url.startsWith("linear-gradient")) score += 15;
  if (postCount > 0) score += 15;
  if (followerCount > 0) score += 10;

  const circumference = 2 * Math.PI * 36;
  const dashOffset = circumference - (score / 100) * circumference;

  if (score === 100) return null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="hsl(var(--border))" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="36" fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-500"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
          {score}%
        </span>
      </div>
      <p className="text-[10px] text-muted-foreground mt-1 text-center">
        Profile {score}% complete ✨
      </p>
    </div>
  );
};

export default ProfileCompleteness;
