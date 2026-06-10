import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export default function GlassCard({ children, className, onClick }: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white/70 backdrop-blur-xl border border-white/50 rounded-xl shadow-[0_10px_30px_rgba(255,209,220,0.3)] overflow-hidden",
        className
      )}
    >
      {children}
    </div>
  );
}
