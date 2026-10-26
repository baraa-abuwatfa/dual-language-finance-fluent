/**
 * Renders copy that contains amounts or percentages ("$2,400", "22%") with each
 * number isolated left-to-right, so Arabic text never shows "%22".
 */
export function NumberText({ text, emphasize = false }: { text: string; emphasize?: boolean }) {
  const parts = text.split(/(\$?\d[\d,.]*%?)/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={emphasize && part.startsWith("$") ? "num font-semibold text-navy" : "num"}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}
