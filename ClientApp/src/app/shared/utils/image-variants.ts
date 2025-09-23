// Feltételezzük az ImageSharp variánsneveket: <guid>_w320.webp / _w640 / _w1024 / _w1600
// és hogy néha _orig.* is előfordulhat.

export function normalizeUploadUrl(url?: string | null): string {
  if (!url) return '';
  let u = url.trim();
  u = u.replace(/^~?\/?wwwroot\/?/i, ''); // wwwroot takarítás
  if (!u.startsWith('/')) u = '/' + u;
  return u;
}

export function preferBestDefault(url: string): string {
  // Ha orig vagy kicsi a default, tereljük 1024-re (grid/kártyára ez a legjobb "általános")
  return url.replace(/_(orig|w\d+)\.(webp|jpe?g|png)$/i, '_w1024.webp');
}

export function buildSrcsetFromVariant(url: string): string {
  const m = url.match(/^(.*\/)([0-9a-f]{32})(?:_(w(\d+)|orig))\.(webp|jpe?g|png)$/i);
  if (!m) return '';
  const base = m[1];
  const guid = m[2];
  const variants = [320, 640, 1024, 1600];
  return variants.map(w => `${base}${guid}_w${w}.webp ${w}w`).join(', ');
}
