import { CloudUpload, Cpu, Lightbulb } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";

import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";
import { SECTION_IDS } from "./SiteHeader";

const STEP_ICONS = [CloudUpload, Cpu, Lightbulb];

export function HowItWorks() {
  const { t } = useI18n();

  return (
    <section id={SECTION_IDS.howItWorks} className="border-y border-border bg-warm py-20 sm:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={t.how.eyebrow} title={t.how.title} />

        <ol className="relative mt-12 grid gap-6 sm:mt-16 md:grid-cols-3 md:gap-8">
          {/* connector line on wide screens */}
          <span
            aria-hidden="true"
            className="absolute inset-x-[16%] top-8 hidden border-t border-dashed border-taupe/50 md:block"
          />
          {t.how.steps.map((step, i) => {
            const Icon = STEP_ICONS[i] ?? Lightbulb;
            return (
              <Reveal as="li" key={step.title} delay={i * 120} className="relative">
                <div className="flex h-full flex-col items-start gap-5 rounded-2xl border border-border bg-card p-6 shadow-card md:items-center md:text-center">
                  <div className="flex items-center gap-4 md:flex-col md:gap-3">
                    <span className="relative grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-navy text-champagne shadow-elevated">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-taupe rtl:text-sm rtl:tracking-normal">
                      {t.how.stepLabel} <span className="num">{String(i + 1).padStart(2, "0")}</span>
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-xl font-semibold text-navy">{step.title}</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground sm:text-[0.95rem]">{step.body}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
