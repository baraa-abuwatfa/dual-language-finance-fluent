import { createFileRoute } from "@tanstack/react-router";

import { About } from "@/components/landing/About";
import { Features } from "@/components/landing/Features";
import { FinalCta } from "@/components/landing/FinalCta";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { InsightsPreview } from "@/components/landing/InsightsPreview";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { SiteHeader } from "@/components/landing/SiteHeader";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AI CFO — Clear finances for small businesses" },
      {
        name: "description",
        content:
          "AI CFO reads your invoices and expenses, organizes your numbers, and explains them in plain language. In Arabic and English.",
      },
      { property: "og:title", content: "AI CFO — Clear finances for small businesses" },
      {
        property: "og:description",
        content: "Invoice processing, expense tracking, financial insights, and automated reports for small businesses.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div id="top" className="flex min-h-screen flex-col overflow-x-clip">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <Features />
        <HowItWorks />
        <InsightsPreview />
        <About />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
