import { Eye, Lock, Scale } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";

import { Reveal } from "./Reveal";
import { Eyebrow } from "./SectionHeading";
import { SECTION_IDS } from "./SiteHeader";

const VALUE_ICONS = [Eye, Lock, Scale];

export function About() {
  const { t } = useI18n();

  return (
    <section id={SECTION_IDS.about} className="border-t border-border bg-card py-20 sm:py-28">
      <div className="container-page grid gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-20">
        <Reveal className="flex flex-col items-start gap-5">
          <Eyebrow>{t.about.eyebrow}</Eyebrow>
          <h2 className="text-3xl font-semibold leading-tight text-navy text-balance sm:text-4xl lg:text-[2.75rem]">
            {t.about.title}
          </h2>
          <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">{t.about.body}</p>
        </Reveal>

        <ul className="flex flex-col divide-y divide-border rounded-2xl border border-border bg-background">
          {t.about.values.map((value, i) => {
            const Icon = VALUE_ICONS[i] ?? Eye;
            return (
              <Reveal as="li" key={value.title} delay={i * 100} className="flex gap-4 p-5 sm:p-6">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-champagne-soft text-taupe">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-semibold text-navy">{value.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">{value.body}</p>
                </div>
              </Reveal>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
