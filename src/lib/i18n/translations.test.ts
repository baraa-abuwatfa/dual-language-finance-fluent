import { describe, expect, it } from "vitest";

import { formatMoney } from "./format";
import { LOCALE_META, dictionaries } from "./translations";

function shape(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(shape);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]));
  }
  return typeof value;
}

describe("i18n", () => {
  it("Arabic renders right-to-left and English left-to-right", () => {
    expect(LOCALE_META.ar.dir).toBe("rtl");
    expect(LOCALE_META.en.dir).toBe("ltr");
  });

  it("Arabic and English dictionaries have identical structure (no missing copy)", () => {
    expect(shape(dictionaries.ar)).toEqual(shape(dictionaries.en));
  });

  it("Arabic navigation is actually translated, not English", () => {
    expect(dictionaries.ar.nav.features).toBe("المزايا");
    expect(dictionaries.ar.nav.features).not.toBe(dictionaries.en.nav.features);
  });

  it("financial numbers use readable Western digits", () => {
    expect(formatMoney(48250)).toBe("$48,250");
  });
});
