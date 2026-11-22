// SKU rules, matching the stock sheet:  UC-001-PNK-XXL
//   UC   supplier code
//   001  design code, padded to 3 digits
//   PNK  colour code (3 letters)
//   XXL  size code (2XL -> XXL, 3XL -> XXXL; other sizes as typed)

const clean = (text: string) => text.toUpperCase().replace(/[^A-Z0-9]/g, '');

const COLOR_CODES: Record<string, string> = {
  PINK: 'PNK', PURPLE: 'PUR', SLATE: 'SLT', BLACK: 'BLK', WHITE: 'WHT', BLUE: 'BLU', RED: 'RED', GREEN: 'GRN',
  GREY: 'GRY', GRAY: 'GRY', YELLOW: 'YLW', ORANGE: 'ORG', BROWN: 'BRN', NAVY: 'NVY', NAVYBLUE: 'NVY', MAROON: 'MRN',
  BEIGE: 'BGE', SILVER: 'SLV', GOLD: 'GLD', CREAM: 'CRM', PEACH: 'PCH', MUSTARD: 'MUS', TEAL: 'TEL', OLIVE: 'OLV',
  OLIVEGREEN: 'OLV', CORAL: 'CRL', ROSEPINK: 'RSP', DUSTYPINK: 'DSP', LAVENDER: 'LVD', MINT: 'MNT', WINE: 'WIN',
  NUDE: 'NUD', SKYBLUE: 'SKY', OFFWHITE: 'OFW', IVORY: 'IVR', MAGENTA: 'MGT', RUST: 'RST', LILAC: 'LLC',
};

/** Pink -> PNK, Slate -> SLT. Unknown colours: first letter + following consonants, 3 letters. */
export function colorCode(color: string): string {
  const name = clean(color);
  if (!name) return '';
  if (COLOR_CODES[name]) return COLOR_CODES[name];
  const consonants = name[0] + name.slice(1).replace(/[AEIOU]/g, '');
  return (consonants.length >= 3 ? consonants : name).slice(0, 3);
}

/** 2XL -> XXL, 3XL -> XXXL, everything else as typed (M, 42, FREESIZE). */
export function sizeCode(size: string): string {
  const name = clean(size);
  const multi = name.match(/^([2-5])XL$/);
  return multi ? 'X'.repeat(Number(multi[1])) + 'L' : name.slice(0, 8);
}

/** UC + 1 -> UC-001 */
export function baseSku(supplierCode: string, designCode: string): string {
  const supplier = clean(supplierCode);
  const design = clean(designCode);
  if (!supplier || !design) return '';
  return `${supplier}-${/^\d+$/.test(design) ? design.padStart(3, '0') : design}`;
}

/** Splits an existing SKU like UC-001-PNK-M back into supplier and design code, to prefill the form. */
export function guessSupplierAndDesign(skus: string[]): { supplier: string; design: string } {
  for (const sku of skus) {
    const m = sku.match(/^([A-Z0-9]+)-([A-Z0-9]+)-/i);
    if (m) return { supplier: m[1].toUpperCase(), design: m[2].replace(/^0+(?=\d)/, '') };
  }
  return { supplier: '', design: '' };
}

/**
 * Every colour x size combination with its SKU. Codes are kept unique within the product
 * (two colours that shorten to the same code get 2, 3... appended).
 */
export function buildCombinations(base: string, colors: string[], sizes: string[]) {
  const unique = (values: string[], toCode: (v: string) => string) => {
    const used = new Set<string>();
    const codes: Record<string, string> = {};
    for (const value of values) {
      const start = toCode(value) || 'X';
      let code = start;
      for (let n = 2; used.has(code); n++) code = `${start}${n}`;
      used.add(code);
      codes[value] = code;
    }
    return codes;
  };
  const colorCodes = unique(colors, colorCode);
  const sizeCodes = unique(sizes, sizeCode);
  const result: { color: string; size: string | null; sku: string }[] = [];
  for (const color of colors) {
    for (const size of sizes.length ? sizes : [null]) {
      result.push({
        color,
        size,
        sku: [base, colorCodes[color], size ? sizeCodes[size] : null].filter(Boolean).join('-'),
      });
    }
  }
  return result;
}
