import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";

type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "start" | "center";
  className?: string;
};

export function Eyebrow({ children, className }: { children: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-taupe rtl:text-sm rtl:tracking-normal rtl:normal-case",
        className,
      )}
    >
      <span className="h-px w-6 bg-champagne" aria-hidden="true" />
      {children}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, align = "center", className }: SectionHeadingProps) {
  return (
    <Reveal
      className={cn(
        "flex max-w-2xl flex-col gap-4",
        align === "center" ? "mx-auto items-center text-center" : "items-start text-start",
        className,
      )}
    >
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="text-3xl font-semibold leading-tight text-navy text-balance sm:text-4xl lg:text-[2.75rem]">
        {title}
      </h2>
      {subtitle ? <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{subtitle}</p> : null}
    </Reveal>
  );
}
