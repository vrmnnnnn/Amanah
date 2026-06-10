import { cn } from "@/lib/utils";

interface CategoryChipProps {
  label: string;
  icon: string;
  selected?: boolean;
  onClick?: () => void;
}

export default function CategoryChip({ label, icon, selected, onClick }: CategoryChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "snap-start flex-shrink-0 px-4 py-2 rounded-full font-semibold text-sm flex items-center gap-1.5 transition-all duration-200 shadow-sm border",
        selected
          ? "bg-primary text-on-primary border-primary"
          : "bg-surface-container border-outline-variant text-on-surface-variant hover:bg-primary-container hover:text-on-primary-container"
      )}
    >
      <span className="material-symbols-outlined text-base">{icon}</span>
      {label}
    </button>
  );
}
