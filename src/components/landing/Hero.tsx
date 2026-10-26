import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";

import { DashboardPreview } from "./DashboardPreview";
import { SECTION_IDS } from "./SiteHeader";
import { useComingSoon } from "./use-coming-soon";

export function Hero() {
  const { t } = useI18n();
  const comingSoon = useComingSoon();

  return (
    <section className="relative isolate overflow-hidden bg-hero pb-16 pt-10 sm:pb-24 sm:pt-16 lg:pt-20">
      {/* Decorative rings */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-40 -top-40 -z-10 h-[32rem] w-[32rem] rounded-full border border-champagne/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-20 -top-20 -z-10 h-[22rem] w-[22rem] rounded-full border border-mist/40"
      />

      <div className="container-page">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-16">
          <div className="flex flex-col items-start gap-6">
            <span className="animate-fade-up inline-flex max-w-full items-center gap-2 rounded-full border border-champagne bg-card/70 px-3 py-1.5 text-xs font-medium text-taupe shadow-sm sm:text-sm">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-taupe" aria-hidden="true" />
              <span className="min-w-0">{t.hero.eyebrow}</span>
            </span>

            <h1
              className="animate-fade-up text-[2.15rem] font-semibold leading-[1.08] text-navy text-balance [animation-delay:100ms] min-[400px]:text-4xl sm:text-5xl lg:text-6xl xl:text-[4.25rem] rtl:leading-[1.3]"
            >
              {t.hero.titleLead}{" "}
              <span className="font-normal italic text-taupe rtl:not-italic rtl:font-semibold">{t.hero.titleAccent}</span>
            </h1>

            <p className="animate-fade-up max-w-xl text-base leading-relaxed text-muted-foreground [animation-delay:200ms] sm:text-lg">
              {t.hero.subtitle}
            </p>

            <div className="animate-fade-up flex w-full flex-col gap-3 [animation-delay:300ms] min-[400px]:w-auto min-[400px]:flex-row">
              <Button variant="hero" size="xl" onClick={comingSoon.signup}>
                {t.hero.primaryCta}
                <ArrowRight className="rtl:-scale-x-100" />
              </Button>
              <Button asChild variant="subtle" size="xl">
                <a href={`#${SECTION_IDS.howItWorks}`}>{t.hero.secondaryCta}</a>
              </Button>
            </div>
          </div>

          <ul className="animate-fade-up flex flex-col gap-3 [animation-delay:400ms] lg:pb-3">
            {t.hero.trust.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm font-medium text-navy sm:text-base">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-champagne-soft text-taupe">
                  <Check className="h-4 w-4" aria-hidden="true" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="animate-rise-in mt-12 [animation-delay:350ms] sm:mt-16">
          <DashboardPreview />
        </div>
      </div>
    </section>
  );
}
