import { FileText, LineChart, FileBarChart2, Wallet, type LucideIcon } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { SECTION_IDS } from "./SiteHeader";

const FEATURE_STYLES: { icon: LucideIcon; tile: string }[] = [
  { icon: FileText, tile: "bg-navy text-champagne" },
  { icon: Wallet, tile: "bg-champagne-soft text-taupe" },
  { icon: LineChart, tile: "bg-secondary text-steel" },
  { icon: FileBarChart2, tile: "bg-warm text-navy border border-champagne/60" },
];

export function Features() {
  const { t } = useI18n();

  return (
    <section id={SECTION_IDS.features} className="bg-background py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={t.features.eyebrow} title={t.features.title} subtitle={t.features.subtitle} />

        <ul className="mt-12 grid gap-4 sm:mt-16 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {t.features.items.map((item, i) => {
            const { icon: Icon, tile } = FEATURE_STYLES[i];
            return (
              <Reveal as="li" key={item.title} delay={i * 90}>
                <article className="lift group flex h-full flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-card hover:border-mist">
                  <span className={cn("grid h-12 w-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105", tile)}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-navy">{item.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">{item.body}</p>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
