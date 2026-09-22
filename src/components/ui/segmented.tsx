import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string }>;
}) {
  return (
    <div className="inline-flex rounded-lg bg-surface-2 p-1 shadow-[0_0_0_1px_rgba(238,242,244,0.08)]">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              "h-9 min-w-[4.75rem] rounded-md px-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-150",
              active ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
