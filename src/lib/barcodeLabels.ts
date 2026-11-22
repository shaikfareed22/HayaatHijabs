import JsBarcode from 'jsbarcode';
import { InventoryItem, formatINR } from '@/lib/inventory';

// Prints barcode labels: number code on top, the barcode, the SKU, then the price.
// The barcode holds the number code (Code 128), so scanning it in Record Sale adds the item.

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function barcodeSvg(value: string): string {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  JsBarcode(svg, value, { format: 'CODE128', width: 1.6, height: 44, margin: 0, displayValue: false });
  return svg.outerHTML;
}

export type LabelCopies = 'one' | 'stock';

/** Returns how many labels were sent to the printer. */
export function printBarcodeLabels(items: InventoryItem[], copies: LabelCopies): number {
  const labels: string[] = [];
  for (const item of items) {
    const code = item.itemCode || item.sku;
    if (!code) continue;
    const count = copies === 'stock' ? Math.max(0, item.stock) : 1;
    if (count === 0) continue;
    const label = `
      <div class="label">
        <div class="code">${escapeHtml(code)}</div>
        <div class="bars">${barcodeSvg(code)}</div>
        <div class="sku">${escapeHtml(item.sku)}</div>
        <div class="price">${escapeHtml(formatINR(item.price))}</div>
      </div>`;
    for (let i = 0; i < count; i++) labels.push(label);
  }
  if (labels.length === 0) return 0;

  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Barcode labels</title>
<style>
  @page { size: A4; margin: 8mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #000; }
  .sheet { display: grid; grid-template-columns: repeat(3, 1fr); gap: 3mm; }
  .label { border: 1px dashed #aaa; padding: 2.5mm 2mm; text-align: center; break-inside: avoid; page-break-inside: avoid; }
  .code { font-size: 13pt; font-weight: 700; letter-spacing: 1px; }
  .bars svg { width: 100%; max-width: 55mm; height: 14mm; display: block; margin: 1mm auto; }
  .sku { font-family: "Courier New", monospace; font-size: 9pt; font-weight: 700; }
  .price { font-size: 12pt; font-weight: 700; margin-top: 0.5mm; }
</style></head><body><div class="sheet">${labels.join('')}</div></body></html>`;

  // Print from a hidden frame so the admin page itself stays as it is.
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const doc = frame.contentWindow?.document;
  if (!doc || !frame.contentWindow) {
    frame.remove();
    return 0;
  }
  doc.open();
  doc.write(html);
  doc.close();
  const win = frame.contentWindow;
  const cleanup = () => setTimeout(() => frame.remove(), 1000);
  win.addEventListener('afterprint', cleanup);
  setTimeout(() => {
    win.focus();
    win.print();
  }, 250);
  return labels.length;
}
