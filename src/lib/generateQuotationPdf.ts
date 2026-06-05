import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PriceSummary } from './pricing';
import type { PillarModel } from '../data/posts';
import type { FenceRow } from '../store/useDesignerStore';
import type { CityResult } from './delivery';
import { translations } from './i18n';
import type { Locale, TranslationKey } from './i18n';

const BRAND_RED = '#d3001b';
const BRAND_BLACK = '#1a1a1a';
const LIGHT_GRAY = '#f5f5f5';
const MID_GRAY = '#e8e8e8';

type QuotationData = {
  price: PriceSummary;
  pillar: PillarModel;
  rows: FenceRow[];
  fenceHeightCm: number;
  concreteColor: string;
  panelOrientation: 'outward' | 'inward';
  deliveryCity?: CityResult | null;       // ← ДОБАВИТЬ
  deliveryDistanceKm?: number;            // ← ДОБАВИТЬ
  deliveryCost?: number;  
  locale?: Locale;
};

export async function generateQuotationPdf(data: QuotationData): Promise<void> {
  const { price, pillar, rows, fenceHeightCm, concreteColor, panelOrientation, deliveryCity, deliveryDistanceKm, deliveryCost,  locale = 'en' } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
   const t = (key: TranslationKey): string => translations[locale][key];

  // ── LOGO ──────────────────────────────────────────────────────────────────
  try {
    const logoBase64 = await imageUrlToBase64('/euromuro_logo.jpg');
    doc.addImage(logoBase64, 'JPEG', margin, 10, 52, 18);
  } catch {
    // Если лого не загрузилось — текст
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(BRAND_RED);
    doc.text('EUROMURO', margin, 22);
  }

  // ── COMPANY INFO (справа) ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const companyLines = [
    'EuroMuro Lda',
    'Rua Exemplo 123, 2710-000 Sintra, Portugal',
    'Tel: +351 912 345 678',
    'info@euromuro.pt  |  www.euromuro.pt',
    'NIF: PT 123 456 789',
  ];
  companyLines.forEach((line, i) => {
    const tw = doc.getTextWidth(line);
    doc.text(line, pageW - margin - tw, 13 + i * 4);
  });

  // ── РАЗДЕЛИТЕЛЬ ───────────────────────────────────────────────────────────
  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, 32, pageW - margin, 32);

  // ── ЗАГОЛОВОК ДОКУМЕНТА (красная полоска слева) ───────────────────────────
  doc.setFillColor(BRAND_RED);
  doc.rect(margin, 36, 3, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_RED);
  const quoteNum = `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  doc.text(`t('quotationTitle')  ${quoteNum}`, margin + 6, 43);

  // Дата справа
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  const dateStr = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateTw = doc.getTextWidth(`Date: ${dateStr}`);
  doc.text(`Date: ${dateStr}`, pageW - margin - dateTw, 43);

  // ── КОНФИГУРАЦИЯ (маленькая сводка) ──────────────────────────────────────
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, 49, pageW - margin * 2, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_RED);
  doc.text('FENCE CONFIGURATION', margin + 4, 55);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(BRAND_BLACK);

  const panelName = rows[0]?.panel.label ?? '—';
  const colorLabel = concreteColor === 'grey' ? 'Standard Grey' : concreteColor === 'white' ? 'White' : `RAL (${concreteColor})`;
  const orientLabel = panelOrientation === 'outward' ? 'Texture outward' : 'Texture inward';
  const pillarLabel = `${pillar.style === 'smooth' ? 'Smooth' : 'Woodlike'} ${pillar.heightCm}cm`;

  const configCols = [
    { label: 'Height', value: `${fenceHeightCm} cm` },
    { label: 'Panel', value: panelName },
    { label: 'Pillar', value: pillarLabel },
    { label: 'Color', value: colorLabel },
    { label: 'Orientation', value: orientLabel },
  ];

  const colW = (pageW - margin * 2 - 8) / configCols.length;
  configCols.forEach((col, i) => {
    const cx = margin + 4 + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(col.label.toUpperCase(), cx, 61);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND_BLACK);
    doc.text(col.value, cx, 65);
  });

  // ── ТАБЛИЦА ПОЗИЦИЙ ───────────────────────────────────────────────────────
  const tableRows: (string | number)[][] = [];

  // Панели
  price.rowBreakdown.forEach((row) => {
    if (row.count > 0) {
      tableRows.push([
        row.label,
        'Panel',
        row.count,
        `${row.price} €/m²`,
        `${row.total} €`,
      ]);
    }
  });

  // Столбы
  tableRows.push([
    `${pillar.style === 'smooth' ? 'Smooth' : 'Woodlike'} Pillar ${pillar.heightCm}cm`,
    'Pillar',
    price.postCount,
    `${pillar.price} €/unit`,
    `${price.postTotal} €`,
  ]);

  autoTable(doc, {
    startY: 72,
    head: [['Product', 'Type', 'Quantity', 'Unit Price', 'Total']],
    body: tableRows,
    margin: { left: margin, right: margin },
    styles: {
      font: 'helvetica',
      fontSize: 9,
      cellPadding: { top: 4, bottom: 4, left: 5, right: 5 },
      textColor: BRAND_BLACK,
      lineColor: MID_GRAY,
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: BRAND_RED,
      textColor: '#ffffff',
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: '#f7fbf9',
    },
    columnStyles: {
      0: { cellWidth: 65 },
      1: { cellWidth: 25, halign: 'center' },
      2: { cellWidth: 25, halign: 'center' },
      3: { cellWidth: 35, halign: 'center' },
      4: { cellWidth: 25, halign: 'right', fontStyle: 'bold' },
    },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── ИТОГО БЛОК ────────────────────────────────────────────────────────────
  const totalBlockX = pageW - margin - 80;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(totalBlockX, afterTable, 80, 22, 2, 2, 'F');

  doc.setDrawColor(BRAND_RED);
  doc.setLineWidth(0.5);
  doc.line(totalBlockX, afterTable + 22, totalBlockX + 80, afterTable + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('Panels subtotal:', totalBlockX + 4, afterTable + 8);
  doc.text('Pillars subtotal:', totalBlockX + 4, afterTable + 14);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLACK);
  doc.text(`${price.panelTotal} €`, totalBlockX + 76, afterTable + 8, { align: 'right' });
  doc.text(`${price.postTotal} €`, totalBlockX + 76, afterTable + 14, { align: 'right' });

  // TOTAL
  doc.setFillColor(BRAND_RED);
  doc.roundedRect(totalBlockX, afterTable + 24, 80, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#ffffff');
  doc.text('TOTAL', totalBlockX + 4, afterTable + 32);
  doc.text(`${price.total} €`, totalBlockX + 76, afterTable + 32, { align: 'right' });

  // ── EXTRA INFO (вес, длина) ────────────────────────────────────────────────
  const extraY = afterTable + 42;

  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, extraY, 80, 28, 2, 2, 'F');

  doc.setDrawColor(BRAND_RED);
  doc.setLineWidth(2);
  doc.line(margin, extraY + 4, margin, extraY + 24);
  doc.setLineWidth(0.3);

  const extraRows = [
    ['Theoretical total weight', `${price.totalWeightKg} kg`],
    ['Total fence length', `${price.totalLengthM} m`],
    ['Number of panels', `${price.panelCount} pcs`],
    ['Number of pillars', `${price.postCount} pcs`],
    ...(deliveryCity ? [
    ['Delivery destination', deliveryCity.displayName.split(',')[0]],
    ['Delivery distance', `~${deliveryDistanceKm} km`],
    ['Delivery cost (est.)', `${deliveryCost} €`],
  ] : []),
  ];

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  extraRows.forEach(([label, value], i) => {
    const ry = extraY + 8 + i * 6;
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + 5, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_BLACK);
    doc.text(value, margin + 75, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 18, pageW - margin, pageH - 18);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  doc.text('This quotation is valid for 30 days. Prices exclude VAT unless stated otherwise.', margin, pageH - 12);
  doc.text('EuroMuro Lda  |  www.euromuro.pt  |  info@euromuro.pt', margin, pageH - 7);

  const pageNumTw = doc.getTextWidth(`Page 1 of 1`);
  doc.text('Page 1 of 1', pageW - margin - pageNumTw, pageH - 7);

  // ── SAVE ──────────────────────────────────────────────────────────────────
  doc.save(`EuroMuro_Quotation_${quoteNum}.pdf`);
}

// Хелпер: URL → base64
async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}