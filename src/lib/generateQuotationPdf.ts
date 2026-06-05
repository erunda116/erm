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
const TAX_RATE = 0.23;

type QuotationData = {
  price: PriceSummary;
  pillar: PillarModel;
  rows: FenceRow[];
  fenceHeightCm: number;
  concreteColor: string;
  panelOrientation: 'outward' | 'inward';
  deliveryCity?: CityResult | null;
  deliveryDistanceKm?: number;
  deliveryCost?: number;
  locale?: Locale;
};

export async function generateQuotationPdf(data: QuotationData): Promise<void> {
  const {
    price, pillar, rows, fenceHeightCm, concreteColor,
    deliveryCity, deliveryDistanceKm, deliveryCost, locale = 'en',
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 14;
  const t = (key: TranslationKey): string => translations[locale][key];

  const isWhite = concreteColor !== 'grey';

  // ── LOGO ──────────────────────────────────────────────────────────────────
  let logoH = 18;
  try {
    const logoBase64 = await imageUrlToBase64('/euromuro_logo.jpg');
    // Фиксированная высота 14мм, ширина пропорционально (лого ~3:1)
    logoH = 14;
    doc.addImage(logoBase64, 'JPEG', margin, 10, 42, logoH); // ← 42×14 сохраняет пропорции
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(BRAND_RED);
    doc.text('EUROMURO', margin, 22);
  }

  // ── TAGLINE под логотипом ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(t('tagline'), margin, 10 + logoH + 4, {
    maxWidth: 90,
  });

  // ── COMPANY INFO (справа) ─────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const companyLines = [
    'EuroMuro Lda',
    'R. Zona Industrial 1111a,',
    'Miranda do Corvo 3220-119, Portugal',
  ];
  companyLines.forEach((line, i) => {
    const tw = doc.getTextWidth(line);
    doc.text(line, pageW - margin - tw, 13 + i * 4);
  });

  // ── РАЗДЕЛИТЕЛЬ ───────────────────────────────────────────────────────────
  const dividerY = 34;
  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  // ── ЗАГОЛОВОК ДОКУМЕНТА ───────────────────────────────────────────────────
  const headerY = dividerY + 4;
  doc.setFillColor(BRAND_RED);
  doc.rect(margin, headerY, 3, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_RED);
  const quoteNum = `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  doc.text(`${t('quotationTitle')}  ${quoteNum}`, margin + 6, headerY + 7);

  // Дата и expiry справа
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 10);
  const fmtDate = (d: Date) => d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateStr   = `Date: ${fmtDate(today)}`;
  const expiryStr = `${t('quotationExpiresLabel')}: ${fmtDate(expiry)}`;
  doc.text(dateStr,   pageW - margin - doc.getTextWidth(dateStr),   headerY + 4);
  doc.text(expiryStr, pageW - margin - doc.getTextWidth(expiryStr), headerY + 9);

  // ── CUSTOM TEXT ──────────────────────────────────────────────────────────
  const customY = headerY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);
  doc.text(t('quotationCustomText'), margin, customY, { maxWidth: pageW - margin * 2 });

  // ── FENCE CONFIGURATION ──────────────────────────────────────────────────
  const configY = customY + 10;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, configY, pageW - margin * 2, 18, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_RED);
  doc.text(t('quotationFenceConfig'), margin + 4, configY + 6);

  const panelName  = rows[0]?.panel.label ?? '—';
  const colorLabel = concreteColor === 'grey' ? 'Standard Grey' : concreteColor === 'white' ? 'White' : `RAL (${concreteColor})`;
  const pillarLabel = `${pillar.style === 'smooth' ? 'Smooth' : 'Woodlike'} ${pillar.heightCm}cm`;

  // Убрали Orientation — только 4 колонки
  const configCols = [
    { label: t('quotationHeight'), value: `${fenceHeightCm} cm` },
    { label: t('quotationPanel'),  value: panelName },
    { label: t('quotationPillar'), value: pillarLabel },
    { label: t('quotationColor'),  value: colorLabel },
  ];

  const colW = (pageW - margin * 2 - 8) / configCols.length;
  configCols.forEach((col, i) => {
    const cx = margin + 4 + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(col.label, cx, configY + 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND_BLACK);
    doc.text(col.value, cx, configY + 16);
  });

  // ── ТАБЛИЦА ПОЗИЦИЙ ───────────────────────────────────────────────────────
  const tableRows: (string | number)[][] = [];

  // Панели
  price.rowBreakdown.forEach((row) => {
    if (row.count > 0) {
      const unitPrice = row.price;
      const tax = Math.round(row.total * TAX_RATE * 100) / 100;
      const ref = rows.find(r => r.panel.label === row.label)?.panel.reference ?? '';
      tableRows.push([
        ref ? `${row.label}\n${ref}` : row.label,
        row.count,
        `${unitPrice} €/m²`,
        `23%`,
        `${row.total} €`,
      ]);
    }
  });

  // Столбы
  const pillarPrice = isWhite ? pillar.priceWhite : pillar.price;
  const pillarRef = (pillar as any).reference ?? '';
  const pillarName = `${pillar.style === 'smooth' ? 'Smooth' : 'Woodlike'} Pillar ${pillar.heightCm}cm`;
  tableRows.push([
    pillarRef ? `${pillarName}\n${pillarRef}` : pillarName,
    price.postCount,
    `${pillarPrice} €/unit`,
    `23%`,
    `${price.postTotal} €`,
  ]);

  // Доставка — если выбрана
  if (deliveryCity && deliveryCost) {
    tableRows.push([
      `${t('quotationDeliveryLabel')} — ${deliveryCity.displayName.split(',')[0]}`,
      1,
      `${deliveryCost} €`,
      `23%`,
      `${deliveryCost} €`,
    ]);
  }

  autoTable(doc, {
    startY: configY + 22,
    // ← Убрали Type, добавили TAX
    head: [[t('quotationPanels'), t('quotationUnitQty'), t('quotationUnitPrice'), 'TAX', t('quotationTotal')]],
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
    alternateRowStyles: { fillColor: '#f7fbf9' },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 35, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 30, halign: 'right', fontStyle: 'bold' },
    },
  });

  const afterTable = (doc as any).lastAutoTable.finalY + 6;

  // ── ИТОГО БЛОК ────────────────────────────────────────────────────────────
  const deliveryTotal = (deliveryCity && deliveryCost) ? deliveryCost : 0;
  const subtotal = Math.round((price.panelTotal + price.postTotal + deliveryTotal) * 100) / 100;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const totalBlockX = pageW - margin - 80;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(totalBlockX, afterTable, 80, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${t('quotationTotalNoTax')}:`, totalBlockX + 4, afterTable + 8);
  doc.text(`${t('quotationTax')}:`,        totalBlockX + 4, afterTable + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLACK);
  doc.text(`${subtotal} €`,  totalBlockX + 76, afterTable + 8,  { align: 'right' });
  doc.text(`${taxAmount} €`, totalBlockX + 76, afterTable + 16, { align: 'right' });

  // TOTAL (с налогом)
  doc.setFillColor(BRAND_RED);
  doc.roundedRect(totalBlockX, afterTable + 26, 80, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#ffffff');
  doc.text(t('quotationTotal').toUpperCase(), totalBlockX + 4, afterTable + 34);
  doc.text(`${grandTotal} €`, totalBlockX + 76, afterTable + 34, { align: 'right' });

  // ── EXTRA INFO ────────────────────────────────────────────────────────────
  const extraY = afterTable + 44;
  const extraRows = [
    [t('quotationWeight'), `${price.totalWeightKg} kg`],
    [t('quotationLength'), `${price.totalLengthM} m`],
    [`${t('quotationPanels')} qty`, `${price.panelCount} pcs`],
    [`${t('quotationPillars')} qty`, `${price.postCount} pcs`],
  ];

  const extraBoxH = extraRows.length * 6 + 10;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, extraY, 85, extraBoxH, 2, 2, 'F');

  doc.setDrawColor(BRAND_RED);
  doc.setLineWidth(2);
  doc.line(margin, extraY + 4, margin, extraY + extraBoxH - 4);
  doc.setLineWidth(0.3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  extraRows.forEach(([label, value], i) => {
    const ry = extraY + 8 + i * 6;
    doc.setTextColor(100, 100, 100);
    doc.text(label, margin + 5, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_BLACK);
    doc.text(value, margin + 80, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  // ── TERMS & CONDITIONS ────────────────────────────────────────────────────
  const termsY = extraY + extraBoxH + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t('quotationTerms')}: https://euromuro.odoo.com/terms`, margin, termsY);

  // ── FOOTER ────────────────────────────────────────────────────────────────
  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(150, 150, 150);
  // ← новый footer без старой фразы про VAT
  doc.text('http://euromuro.eu  |  info@euromuro.eu  |  PT517982480', margin, pageH - 8);

  const pageNumTw = doc.getTextWidth('Page 1 of 1');
  doc.text('Page 1 of 1', pageW - margin - pageNumTw, pageH - 8);

  doc.save(`EuroMuro_Quotation_${quoteNum}.pdf`);
}

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