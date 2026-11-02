import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Loader2, MessageSquareText, SendHorizonal, Trash2 } from "lucide-react";
import { PageError, PageHeader, PageNotFound, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { askAssistant } from "@/lib/assistant/assistant.functions";
import { assistantCopy } from "@/lib/assistant/copy";
import { authHead } from "@/lib/auth/head";
import { useAppCopy, useCompany } from "@/lib/company/use-company";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/_company/insights")({
  head: () => authHead("AI Financial Assistant", "Ask questions about your company's real recorded finances."),
  component: Assistant,
  errorComponent: PageError,
  notFoundComponent: PageNotFound,
});

type Msg = { role: "user" | "assistant"; content: string };

function Assistant() {
  const { locale } = useAppCopy();
  const t = assistantCopy[locale];
  const { company } = useCompany();
  const ask = useServerFn(askAssistant);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const submit = async (question: string) => {
    const q = question.trim();
    if (!q || busy) return;
    setError(null);
    setDraft("");
    const history = messages.slice(-12);
    setMessages((m) => [...m, { role: "user", content: q }]);
    setBusy(true);
    try {
      const res = await ask({ data: { companyId: company.id, locale, question: q, history } });
      if (res.ok && res.answer) {
        setMessages((m) => [...m, { role: "assistant", content: res.answer! }]);
      } else {
        setError(res.code === "configuration" ? t.configError : res.code === "access" ? t.accessError : t.error);
      }
    } catch {
      setError(t.error);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  };

  return <>
    <PageHeader title={t.title} description={t.intro} />
    <Panel>
      <div className="flex flex-col gap-4" aria-live="polite">
        {/* Welcome + suggested questions */}
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-navy text-on-navy"><MessageSquareText className="size-4" aria-hidden="true" /></span>
          <div className="rounded-2xl rounded-ss-sm bg-background p-4 text-sm leading-6 text-navy">{t.welcome}</div>
        </div>

        {messages.length === 0 && <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t.suggestedTitle}</p>
          <div className="flex flex-wrap gap-2">
            {t.suggested.map((q) => <Button key={q} type="button" variant="subtle" size="sm" disabled={busy} onClick={() => void submit(q)}>{q}</Button>)}
          </div>
        </div>}

        {/* Conversation */}
        {messages.map((m, i) => m.role === "user"
          ? <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl rounded-se-sm bg-navy px-4 py-3 text-sm leading-6 text-on-navy"><span className="sr-only">{t.you}: </span>{m.content}</div></div>
          : <div key={i} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-steel text-on-navy"><MessageSquareText className="size-4" aria-hidden="true" /></span>
              <div className="max-w-[85%] rounded-2xl rounded-ss-sm bg-background p-4 text-sm leading-6 text-navy [&_li]:ms-4 [&_li]:list-disc [&_p]:mb-2 [&_strong]:font-semibold"><span className="sr-only">{t.assistant}: </span><ReactMarkdown>{m.content}</ReactMarkdown></div>
            </div>)}

        {busy && <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-steel text-on-navy"><Loader2 className="size-4 animate-spin" aria-hidden="true" /></span>
          {t.thinking}
        </div>}

        {error && <p role="alert" className="rounded-lg border-s-4 border-negative bg-background p-3 text-sm text-negative">{error}</p>}
      </div>

      {/* Composer */}
      <form className="mt-4 flex items-end gap-2 border-t border-input pt-4" onSubmit={(e) => { e.preventDefault(); void submit(draft); }}>
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void submit(draft); } }}
          placeholder={t.placeholder}
          rows={1}
          autoFocus
          className="min-h-10 flex-1 resize-none rounded-md border border-input bg-card px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
          aria-label={t.placeholder}
        />
        <Button type="submit" disabled={busy || !draft.trim()} aria-label={t.send}><SendHorizonal className="size-4 rtl:-scale-x-100" aria-hidden="true" />{t.send}</Button>
        {messages.length > 0 && <Button type="button" variant="subtle" disabled={busy} onClick={() => { setMessages([]); setError(null); inputRef.current?.focus(); }} aria-label={t.clear}><Trash2 className="size-4" aria-hidden="true" /><span className="hidden sm:inline">{t.clear}</span></Button>}
      </form>
      <p className={cn("mt-2 text-xs text-muted-foreground")}>{t.sessionNote}</p>
    </Panel>
  </>;
}
