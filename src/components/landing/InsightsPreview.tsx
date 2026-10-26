import { AlertTriangle, CheckCircle2, Clock, MessageSquareText, Sparkles } from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { cn } from "@/lib/utils";

import { NumberText } from "./NumberText";
import { Reveal } from "./Reveal";
import { SectionHeading } from "./SectionHeading";

const TONES = {
  warning: { icon: AlertTriangle, tile: "bg-champagne-soft text-taupe" },
  positive: { icon: CheckCircle2, tile: "bg-positive-soft text-positive" },
  info: { icon: Clock, tile: "bg-secondary text-steel" },
} as const;

export function InsightsPreview() {
  const { t } = useI18n();

  return (
    <section className="bg-background py-20 sm:py-28">
      <div className="container-page grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <div className="flex flex-col gap-8">
          <SectionHeading
            align="start"
            eyebrow={t.insights.eyebrow}
            title={t.insights.title}
            subtitle={t.insights.subtitle}
          />
          <ul className="flex flex-col gap-4">
            {t.insights.points.map((point, i) => (
              <Reveal as="li" key={point} delay={i * 90} className="flex items-start gap-3">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-navy text-champagne">
                  <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span className="text-base text-navy">{point}</span>
              </Reveal>
            ))}
          </ul>
        </div>

        <Reveal delay={150}>
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute -inset-4 -z-10 rounded-[2rem] bg-champagne-gradient opacity-20 blur-2xl"
            />
            <div className="rounded-2xl border border-cloud bg-card p-4 shadow-preview sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="font-sans text-base font-semibold text-navy">{t.insights.cardTitle}</h3>
                <span className="rounded-full border border-champagne bg-champagne-soft px-2.5 py-0.5 text-xs font-semibold text-taupe">
                  {t.insights.cardBadge}
                </span>
              </div>
              <ul className="flex flex-col gap-3">
                {t.insights.items.map((item) => {
                  const tone = TONES[item.tone as keyof typeof TONES];
                  const Icon = tone.icon;
                  return (
                    <li
                      key={item.title}
                      className="flex gap-3 rounded-xl border border-border bg-background p-3 transition-colors duration-200 hover:border-mist sm:p-4"
                    >
                      <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg", tone.tile)}>
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <div className="flex min-w-0 flex-col gap-1">
                        <p className="text-sm font-semibold text-navy">
                          <NumberText text={item.title} />
                        </p>
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          <NumberText text={item.body} emphasize />
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div
                aria-hidden="true"
                className="mt-4 flex items-center gap-3 rounded-xl border border-dashed border-cloud bg-warm px-4 py-3 text-sm text-muted-foreground"
              >
                <MessageSquareText className="h-4 w-4 shrink-0 text-steel" />
                <span className="truncate">{t.insights.askPlaceholder}</span>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
