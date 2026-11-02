import { PDFDocument } from "pdf-lib";
import type { FinancialReport } from "./report-model";
import { reportCopy } from "./report-copy";
import { intelCopy } from "./intelligence-copy";
import { categoryLabel } from "./categories";
import { monthLabel } from "./queries";

type Company = { id: string; name: string; currency: string };
type Locale = "en" | "ar";
export function reportFilename(company: Company, report: FinancialReport, locale: Locale) {
  const name = company.name.replace(/[^\p{L}\p{N}\-_]+/gu, "-").slice(0, 70) || "company";
  return `${name}-${report.selection.type}-${report.range.from.slice(0, report.selection.type === "annual" ? 4 : 7)}-${locale}.pdf`;
}
export async function generateReportPdf(report: FinancialReport, company: Company, locale: Locale): Promise<Blob> {
  const font = new FontFace("CFO Report", "url(/fonts/report-arabic.ttf)");
  await font.load(); document.fonts.add(font); await document.fonts.ready;
  const t = reportCopy[locale], intel = intelCopy[locale], rtl = locale === "ar";
  const fmt = (v: number) => new Intl.NumberFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { style: "currency", currency: company.currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
  const pct = (v: number | null) => v === null ? "—" : `${v.toFixed(1)}%`;
  const period = report.selection.type === "annual" ? String(report.selection.year) : monthLabel(report.range.from.slice(0, 7), locale);
  const title = report.selection.type === "annual" ? t.annual : t.monthly;
  const generated = new Intl.DateTimeFormat(locale === "ar" ? "ar-u-nu-latn" : "en-US", { dateStyle: "long" }).format(new Date());
  const probe = document.createElement("span"); document.body.appendChild(probe);
  const token = (name: string) => { probe.style.color = `var(--${name})`; return getComputedStyle(probe).color; };
  const colors = { navy: token("navy"), steel: token("steel"), mist: token("mist"), beige: token("champagne"), background: token("background"), white: token("card"), muted: token("muted-foreground"), border: token("border"), positive: token("positive"), negative: token("negative") };
  probe.remove();
  const pdf = await PDFDocument.create();
  pdf.setTitle(`${company.name} — ${title} — ${period}`); pdf.setAuthor("AI CFO"); pdf.setSubject(`${report.range.from} / ${report.range.to} · ${company.currency}`);
  const W = 794, H = 1123, M = 56, CW = W - M * 2;
  const pages: HTMLCanvasElement[] = [];
  let ctx: CanvasRenderingContext2D, y = 0;
  const text = (s: string, x: number, yy: number, size = 14, color = colors.navy, align: CanvasTextAlign = rtl ? "right" : "left") => {
    ctx.font = `${size}px "CFO Report"`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = "top"; ctx.direction = rtl ? "rtl" : "ltr"; ctx.fillText(s, x, yy);
  };
  const rect = (x: number, yy: number, w: number, h: number, color: string) => { ctx.fillStyle = color; ctx.fillRect(x, yy, w, h); };
  const start = (section?: string) => {
    const canvas = document.createElement("canvas"); canvas.width = W * 2; canvas.height = H * 2;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable"); ctx = context; ctx.scale(2, 2); pages.push(canvas);
    rect(0, 0, W, H, colors.white); rect(M, 45, CW, 2, colors.beige);
    text(company.name, rtl ? W - M : M, 59, 13); text("AI CFO", rtl ? M : W - M, 59, 13, colors.steel, rtl ? "left" : "right");
    y = 100; if (section) heading(section);
  };
  const ensure = (h: number) => { if (y + h > H - 95) start(); };
  const wrap = (s: string, width: number, size: number) => {
    ctx.font = `${size}px "CFO Report"`; const lines: string[] = []; let line = "";
    for (const word of s.split(/\s+/)) {
      if (ctx.measureText(word).width > width) {
        if (line) { lines.push(line); line = ""; }
        let part = ""; for (const char of word) { if (ctx.measureText(part + char).width > width) { lines.push(part); part = ""; } part += char; } line = part;
      } else if (ctx.measureText(`${line} ${word}`).width > width && line) { lines.push(line); line = word; }
      else line = line ? `${line} ${word}` : word;
    }
    if (line) lines.push(line); return lines.length ? lines : ["—"];
  };
  const paragraph = (s: string, color = colors.muted, size = 15) => {
    for (const line of wrap(s, CW, size)) { ensure(27); text(line, rtl ? W - M : M, y, size, color); y += 25; } y += 12;
  };
  function heading(s: string) { ensure(70); text(s, rtl ? W - M : M, y, 25); y += 53; }
  const section = (s: string) => start(s);
  const table = (headers: string[], rows: string[][], widths?: number[]) => {
    const fractions = widths ?? headers.map(() => 1 / headers.length);
    const drawRow = (cells: string[], header: boolean) => {
      const sizes = fractions.map((f) => f * CW);
      const lines = cells.map((s, i) => wrap(s, (sizes[i] ?? CW) - 20, 12));
      const height = Math.max(...lines.map((l) => l.length)) * 22 + 18;
      if (y + height > H - 95) { start(); if (!header) drawRow(headers, true); }
      rect(M, y, CW, height, header ? colors.background : colors.white);
      let x = rtl ? W - M : M;
      cells.forEach((_, i) => { const width = sizes[i] ?? CW; const left = rtl ? x - width : x;
        (lines[i] ?? []).forEach((line, j) => text(line, rtl ? left + width - 10 : left + 10, y + 8 + j * 22, 12, header ? colors.steel : colors.navy));
        x += rtl ? -width : width;
      });
      y += height; rect(M, y - 1, CW, 1, colors.border);
    };
    drawRow(headers, true); for (const row of rows) drawRow(row, false); y += 24;
  };
  const chart = (kind: "bars" | "line") => {
    ensure(310); const top = y + 10, left = M + 90, right = W - M - 10, bottom = top + 205;
    const points = report.trends; const values = points.flatMap((p) => kind === "bars" ? [p.revenue, p.expenses] : [p.net]);
    const max = Math.max(1, ...values), min = Math.min(0, ...values), span = max - min;
    const py = (v: number) => bottom - (v - min) / span * 190;
    for (let i = 0; i <= 4; i++) { const value = min + span * i / 4, yy = py(value); rect(left, yy, right - left, 1, colors.border); text(fmt(value), left - 8, yy - 8, 10, colors.muted, "right"); }
    const step = (right - left) / points.length;
    points.forEach((p, i) => {
      const x = left + step * (i + 0.5);
      if (kind === "bars") { const w = step * 0.3; rect(x - w, py(p.revenue), w, Math.max(1, py(0) - py(p.revenue)), colors.navy); rect(x + 2, py(p.expenses), w, Math.max(1, py(0) - py(p.expenses)), colors.steel); }
      else { const next = points[i + 1]; if (next) { ctx.beginPath(); ctx.strokeStyle = colors.steel; ctx.lineWidth = 3; ctx.moveTo(x, py(p.net)); ctx.lineTo(x + step, py(next.net)); ctx.stroke(); } ctx.beginPath(); ctx.fillStyle = p.net < 0 ? colors.negative : colors.navy; ctx.arc(x, py(p.net), 3, 0, Math.PI * 2); ctx.fill(); }
      if (points.length <= 12 || i % 5 === 0 || i === points.length - 1) text(report.selection.type === "annual" ? monthLabel(p.key, locale).replace(/\s?\d{2}$/, "") : p.key.slice(-2), x, bottom + 14, 11, colors.muted, "center");
    });
    text(kind === "bars" ? `${t.income} / ${t.spending} · ${company.currency}` : `${t.net} · ${company.currency}`, rtl ? W - M : M, bottom + 50, 12, colors.steel);
    if (kind === "bars") { rect(M, bottom + 80, 14, 8, colors.navy); text(t.income, M + 22, bottom + 74, 11, colors.navy, "left"); rect(M + 280, bottom + 80, 14, 8, colors.steel); text(t.spending, M + 302, bottom + 74, 11, colors.steel, "left"); }
    y = bottom + 115;
  };
  const a = report.analysis;
  const alertText = (alert: (typeof a.alerts)[number]) => alert.kind === "negativeNet" ? intel.a.negativeNet(fmt(Math.abs(alert.net)))
    : alert.kind === "unusual" ? intel.a.unusual(fmt(alert.item.tx.amount), categoryLabel(alert.item.tx.category, locale), alert.item.tx.occurred_on, String(alert.item.ratio))
    : intel.a[alert.kind](fmt(alert.current), fmt(alert.previous), pct(alert.change));
  const recommendation = (r: (typeof a.recs)[number]): string => {
    switch (r.kind) {
      case "categoryGrowth": return `${intel.r.categoryGrowth(categoryLabel(r.category, locale))} ${intel.r.categoryGrowthWhy(fmt(r.previous), fmt(r.current), pct(r.change))}`;
      case "concentration": return `${intel.r.concentration(categoryLabel(r.category, locale))} ${intel.r.concentrationWhy(fmt(r.amount), pct(r.share))}`;
      case "cutCosts": return `${intel.r.cutCosts} ${intel.r.cutCostsWhy(fmt(r.net), fmt(r.expenses))}`;
      case "revenueFollowUp": return `${intel.r.revenueFollowUp} ${intel.r.revenueFollowUpWhy(fmt(r.previous), fmt(r.current), pct(r.change))}`;
      case "verifyUnusual": return `${intel.r.verifyUnusual(categoryLabel(r.item.tx.category, locale))} ${intel.r.verifyUnusualWhy(fmt(r.item.tx.amount), fmt(r.item.average), String(r.item.samples))}`;
    }
  };
  const narrative = report.records.length ? t.summaryText(fmt(report.totals.revenue), fmt(report.totals.expenses), fmt(report.totals.net), pct(report.totals.margin), String(report.records.length)) : t.empty;
  const position = report.totals.net > 0 ? t.positive : report.totals.net < 0 ? t.negative : t.balanced;

  start(); rect(0, 190, W, 275, colors.navy); rect(M, 222, 65, 5, colors.beige);
  y = 275; for (const line of wrap(company.name, CW, 34)) { text(line, rtl ? W - M : M, y, 34, colors.white); y += 49; }
  y = Math.max(y + 30, 495); heading(title); paragraph(period, colors.steel, 24);
  table([t.period, t.generated, t.currency], [[`${report.range.from} — ${report.range.to}`, generated, company.currency]]);
  paragraph(t.footer); paragraph(t.coverage); if (report.range.to >= new Date().toISOString().slice(0, 10)) paragraph(t.partial);
  section(t.summary);
  const kpis = [[t.income, fmt(report.totals.revenue)], [t.spending, fmt(report.totals.expenses)], [t.net, fmt(report.totals.net)], [t.margin, pct(report.totals.margin)]];
  kpis.forEach(([label, value], i) => { const x = M + (rtl ? 1 - i % 2 : i % 2) * (CW / 2 + 8); const yy = y + Math.floor(i / 2) * 110; rect(x, yy, CW / 2 - 8, 94, colors.background); text(label ?? "", rtl ? x + CW / 2 - 24 : x + 16, yy + 14, 14, colors.steel); text(value ?? "", rtl ? x + CW / 2 - 24 : x + 16, yy + 47, 22); });
  y += 245; paragraph(narrative, colors.navy); if (report.records.length) paragraph(position); paragraph(t.coverage);
  section(t.performance); heading(t.bars); chart("bars"); heading(t.trend); chart("line");
  heading(t.comparison); paragraph(`${report.previous.from} — ${report.previous.to}`);
  if (report.hasPrevious && report.records.length) table([t.metric, t.current, t.previous, t.change], [[t.income, fmt(a.now.revenue), fmt(a.before.revenue), pct(a.revChange)], [t.spending, fmt(a.now.expenses), fmt(a.before.expenses), pct(a.expChange)], [t.net, fmt(a.now.net), fmt(a.before.net), pct(a.netChange)]]);
  else paragraph(t.noPrevious);
  for (const alert of a.alerts.filter((x) => x.kind !== "unusual")) paragraph(alertText(alert));
  section(t.revenue); paragraph(`${t.income}: ${fmt(report.totals.revenue)}`, colors.navy, 22);
  if (report.income.length) table([t.category, t.amount, t.share], report.income.map((c) => [categoryLabel(c.category, locale), fmt(c.amount), pct(c.amount / report.totals.revenue * 100)]), [0.45, 0.35, 0.2]); else paragraph(t.noIncome);
  if (report.best) paragraph(t.best(report.selection.type === "annual" ? monthLabel(report.best.key, locale) : report.best.key, fmt(report.best.revenue)));
  if (report.hasPrevious && a.revChange !== null) paragraph(`${t.income} · ${t.change}: ${pct(a.revChange)} (${fmt(a.before.revenue)} → ${fmt(a.now.revenue)})`);
  section(t.expenses); paragraph(`${t.spending}: ${fmt(report.totals.expenses)}`, colors.navy, 22);
  if (report.expenses.length) {
    heading(t.distribution);
    const maximum = report.expenses[0]?.amount ?? 1;
    for (const c of report.expenses) { ensure(88); paragraph(`${categoryLabel(c.category, locale)} · ${fmt(c.amount)} · ${pct(c.amount / report.totals.expenses * 100)}`, colors.navy, 13); rect(M, y, CW, 8, colors.background); rect(rtl ? W - M - CW * c.amount / maximum : M, y, CW * c.amount / maximum, 8, colors.steel); y += 27; }
    table([t.category, t.amount, t.share], report.expenses.map((c) => [categoryLabel(c.category, locale), fmt(c.amount), pct(c.amount / report.totals.expenses * 100)]), [0.45, 0.35, 0.2]);
    const top = report.expenses[0]; if (top) paragraph(t.top(categoryLabel(top.category, locale), fmt(top.amount), pct(top.amount / report.totals.expenses * 100)));
  } else paragraph(t.noExpenses);
  for (const u of a.unusual) paragraph(intel.a.unusual(fmt(u.tx.amount), categoryLabel(u.tx.category, locale), u.tx.occurred_on, String(u.ratio)));
  section(t.statements);
  if (report.selection.type === "annual") table([t.month, t.income, t.spending, t.net, t.margin], [...report.annual.map((m) => [monthLabel(m.month, locale), fmt(m.revenue), fmt(m.expenses), fmt(m.net), pct(m.margin)]), [t.total, fmt(report.totals.revenue), fmt(report.totals.expenses), fmt(report.totals.net), pct(report.totals.margin)]], [0.17, 0.23, 0.23, 0.23, 0.14]);
  else { paragraph(narrative); heading(t.records); if (!report.records.length) paragraph(t.empty); else table([t.date, t.transactionType, t.category, t.description, t.amount], report.records.map((r) => [r.occurred_on, r.type === "income" ? t.incomeType : t.expenseType, categoryLabel(r.category, locale), r.description ?? "—", fmt(r.amount)]), [0.16, 0.12, 0.23, 0.27, 0.22]); }
  section(t.intelligence); paragraph(t.method); heading(t.findings);
  if (!a.alerts.length) paragraph(report.records.length ? t.noRisk : t.empty);
  for (const alert of a.alerts) paragraph(alertText(alert), colors.navy);
  for (const missing of a.missing) paragraph(intel.missing[missing]);
  heading(t.actions); if (!a.recs.length) paragraph(intel.recsNone); for (const rec of a.recs) paragraph(recommendation(rec), colors.navy);
  section(t.conclusion); paragraph(narrative, colors.navy); if (report.records.length) paragraph(position);
  for (const alert of a.alerts.slice(0, 3)) paragraph(alertText(alert)); for (const rec of a.recs.slice(0, 3)) paragraph(recommendation(rec));
  if (!report.records.length) paragraph(intel.missing.noData); paragraph(t.coverage);
  for (let i = 0; i < pages.length; i++) {
    const canvas = pages[i]; if (!canvas) continue; const context = canvas.getContext("2d"); if (!context) throw new Error("Canvas unavailable"); ctx = context;
    rect(M, H - 65, CW, 1, colors.border); text(t.footer, rtl ? W - M : M, H - 49, 11, colors.muted); text(`${t.page} ${i + 1} / ${pages.length}`, rtl ? M : W - M, H - 49, 11, colors.muted, rtl ? "left" : "right");
    const imageBlob = await new Promise<Blob>((resolve, reject) => canvas.toBlob((b) => b ? resolve(b) : reject(new Error("Image generation failed")), "image/png"));
    const image = await pdf.embedPng(await imageBlob.arrayBuffer()); const page = pdf.addPage([595.28, 841.89]); page.drawImage(image, { x: 0, y: 0, width: 595.28, height: 841.89 });
    // Allow the browser to update progress without using server resources.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return new Blob([new Uint8Array(await pdf.save())], { type: "application/pdf" });
}
export async function deliverReport(blob: Blob, filename: string) {
  const file = new File([blob], filename, { type: "application/pdf" });
  if (matchMedia("(pointer: coarse)").matches && navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file], title: filename }); return; }
    catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(blob), link = document.createElement("a");
  link.href = url; link.download = filename; document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 30_000);
}