// Magyar ékezeteket is kezelő slugify + útvonal slugify.

const HUN_MAP: Record<string, string> = {
  'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ö': 'o', 'ő': 'o', 'ú': 'u', 'ü': 'u', 'ű': 'u',
  'Á': 'a', 'É': 'e', 'Í': 'i', 'Ó': 'o', 'Ö': 'o', 'Ő': 'o', 'Ú': 'u', 'Ü': 'u', 'Ű': 'u'
};

export function slugify(input: string): string {
  if (!input) return '';
  let s = Array.from(input).map(ch => HUN_MAP[ch] ?? ch).join('');
  s = s.normalize('NFKD').replace(/[\u0300-\u036f]/g, ''); // diakritikák le
  s = s.toLowerCase();
  s = s.replace(/[^a-z0-9]+/g, '-');  // nem megengedett -> kötőjel
  s = s.replace(/-+/g, '-');          // több kötőjelből 1
  s = s.replace(/^-|-$/g, '');        // szélekről le
  return s;
}

// Menü-útvonal (pl. "Üdvözöljük! / Rólunk…") -> slug
export function slugifyPath(path: string | string[]): string {
  const txt = Array.isArray(path) ? path.join(' ') : path;
  return slugify(txt);
}
