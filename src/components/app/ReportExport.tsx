import { useEffect, useRef, useState } from "react";
import { Download, LoaderCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FinancialReport } from "@/lib/finance/report-model";
import { reportCopy } from "@/lib/finance/report-copy";
type Delivery = (blob: Blob, filename: string) => Promise<void>;
export function ReportExport({ report, company, locale }: { report: FinancialReport; company: { id: string; name: string; currency: string }; locale: "en" | "ar" }) {
  const t = reportCopy[locale];
  const identity = `${company.id}:${company.name}:${company.currency}:${locale}:${report.selection.type}:${report.selection.year}:${report.selection.month}`;
  const [result, setResult] = useState<{ blob: Blob; filename: string; identity: string; report: FinancialReport; deliver: Delivery }>();
  const [failed, setFailed] = useState(false), [retry, setRetry] = useState(0);
  const downloadLock = useRef(false);
  useEffect(() => {
    let cancelled = false;
    setResult(undefined); setFailed(false);
    const timer = setTimeout(async () => {
      try {
        const { generateReportPdf, reportFilename, deliverReport } = await import("@/lib/finance/report-pdf");
        if (cancelled) return;
        const blob = await generateReportPdf(report, company, locale);
        if (!cancelled) setResult({ blob, filename: reportFilename(company, report, locale), identity, report, deliver: deliverReport });
      } catch { if (!cancelled) setFailed(true); }
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [report, company.id, company.name, company.currency, locale, identity, retry]);
  const ready = result?.identity === identity && result.report === report;
  const download = async () => {
    if (!ready || !result || downloadLock.current) return;
    downloadLock.current = true;
    try { await result.deliver(result.blob, result.filename); }
    catch { setFailed(true); }
    finally { downloadLock.current = false; }
  };
  return <div className="flex min-w-0 flex-col gap-2">
    <Button disabled={!ready && !failed} onClick={failed ? () => setRetry((n) => n + 1) : download} className="h-auto min-h-10 max-w-full whitespace-normal py-2 text-start">
      {failed ? <RotateCcw className="size-4 shrink-0" /> : ready ? <Download className="size-4 shrink-0" /> : <LoaderCircle className="size-4 shrink-0 animate-spin" />}
      {ready || failed ? t.download : t.generating}
    </Button>
    {failed && <p role="alert" className="text-sm text-negative">{t.error}</p>}
  </div>;
}