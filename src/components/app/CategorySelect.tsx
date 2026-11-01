import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { categoriesFor, categoryCopy, categoryLabel, type CategoryType } from "@/lib/finance/categories";

export function CategorySelect({ id, type, value, onChange, legacy, disabled, invalid, describedBy }: {
  id: string; type: CategoryType; value: string; onChange: (value: string) => void;
  legacy?: string | undefined; disabled?: boolean; invalid?: boolean; describedBy?: string | undefined;
}) {
  const { locale, dir } = useI18n();
  const [open, setOpen] = useState(false);
  const t = categoryCopy[locale];
  const options: { id: string; ar: string }[] = [...categoriesFor(type)];
  // Only the current record's category is retained; this is not custom creation.
  if (legacy && !options.some((c) => c.id === legacy)) options.unshift({ id: legacy, ar: legacy });
  return <Popover open={open} onOpenChange={setOpen}>
    <PopoverTrigger asChild>
      <Button id={id} type="button" variant="outline" role="combobox" aria-expanded={open} aria-invalid={invalid} aria-describedby={describedBy} disabled={disabled} className="h-auto min-h-10 w-full justify-between gap-2 text-start font-normal">
        <span className="min-w-0 whitespace-normal break-words">{value ? categoryLabel(value, locale) : t.choose}</span><ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent dir={dir} align="start" className="w-[var(--radix-popover-trigger-width)] max-w-[calc(100vw-2rem)] p-0">
      <Command>
        <CommandInput placeholder={t.search} aria-label={t.search} />
        <CommandList><CommandEmpty>{t.empty}</CommandEmpty>
          {options.map((c) => <CommandItem key={c.id} value={c.id} keywords={[c.ar]} onSelect={() => { onChange(c.id); setOpen(false); }}>
            <Check className={value === c.id ? "opacity-100" : "opacity-0"} /><span className="min-w-0 whitespace-normal break-words">{locale === "ar" ? c.ar : c.id}</span>
          </CommandItem>)}
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>;
}