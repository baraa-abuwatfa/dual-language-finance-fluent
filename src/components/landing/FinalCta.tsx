import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/I18nProvider";

import { Reveal } from "./Reveal";
import { SECTION_IDS } from "./SiteHeader";
import { useComingSoon } from "./use-coming-soon";

export function FinalCta() {
  const { t } = useI18n();
  const comingSoon = useComingSoon();

  return (
    <section className="bg-card pb-20 sm:pb-28">
      <div className="container-page">
        <Reveal>
          <div className="relative isolate overflow-hidden rounded-3xl bg-navy-gradient px-6 py-14 text-center shadow-preview sm:px-12 sm:py-20">
            <div
              aria-hidden="true"
              className="absolute -start-24 -top-24 -z-10 h-72 w-72 rounded-full border border-champagne/30"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-32 -end-16 -z-10 h-96 w-96 rounded-full bg-champagne/10 blur-3xl"
            />
            <div className="mx-auto flex max-w-2xl flex-col items-center gap-5">
              <h2 className="text-3xl font-semibold leading-tight text-on-navy text-balance sm:text-4xl lg:text-5xl">
                {t.cta.title}
              </h2>
              <p className="text-base leading-relaxed text-on-navy-muted sm:text-lg">{t.cta.subtitle}</p>
              <div className="mt-3 flex w-full flex-col gap-3 min-[400px]:w-auto min-[400px]:flex-row">
                <Button variant="champagne" size="xl" onClick={comingSoon.signup}>
                  {t.cta.primary}
                  <ArrowRight className="rtl:-scale-x-100" />
                </Button>
                <Button asChild variant="onNavy" size="xl">
                  <a href={`#${SECTION_IDS.features}`}>{t.cta.secondary}</a>
                </Button>
              </div>
              <p className="text-sm text-on-navy-muted">{t.cta.note}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
