import type { CSSProperties, ReactNode, Ref } from "react";

import { useReveal } from "@/hooks/use-reveal";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "li" | "article";
};

export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const ref = useReveal<HTMLElement>();
  const Tag = as as "div";
  return (
    <Tag
      ref={ref as Ref<HTMLDivElement>}
      className={cn("reveal", className)}
      style={{ "--reveal-delay": `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  );
}
