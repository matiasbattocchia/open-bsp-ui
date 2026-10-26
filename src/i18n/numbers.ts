import useBoundStore from "@/stores/useBoundStore";

/**
 * A number in the app's language, not the browser's: 1.234,5 in Spanish,
 * 1,234.5 in English. Thousands are always grouped — Spanish alone leaves
 * four digits bare (5000), which reads off next to 5.000 in Portuguese.
 *
 * Reads the language when called; a component showing the result re-renders
 * on a language change through useTranslation, which subscribes to it.
 */
export function formatNumber(n: number, options?: Intl.NumberFormatOptions) {
  return n.toLocaleString(useBoundStore.getState().ui.language, {
    // "always" is ES2023 Intl, past this project's ES2022 lib typings.
    useGrouping: "always" as unknown as boolean,
    ...options,
  });
}
