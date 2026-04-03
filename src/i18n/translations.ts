const cache = new Map<string, Record<string, string>>();

export async function loadTranslations(lang: string): Promise<void> {
  if (lang === "es" || cache.has(lang)) return;

  const res = await fetch(`/locales/${lang}.json`);
  if (res.ok) {
    cache.set(lang, await res.json());
  }
}

export function getTranslation(key: string, lang: string): string {
  if (lang === "es") return key;
  return cache.get(lang)?.[key] || key;
}
