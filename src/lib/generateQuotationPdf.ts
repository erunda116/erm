import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PriceSummary } from './pricing';
import type { PillarModel } from '../data/posts';
import type { FenceRow } from '../store/useDesignerStore';
import type { CityResult } from './delivery';
import { translations } from './i18n';
import type { Locale, TranslationKey } from './i18n';
import { renderFenceSegmentPage } from './renderFenceSegmentPage';

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
  baseConcreteColor: 'grey' | 'white';
  panelOrientation: 'outward' | 'inward';
  textureSide?: 'inward' | 'outward' | 'double';
  deliveryCity?: CityResult | null;
  deliveryDistanceKm?: number;
  deliveryTrucks?: number;
  deliveryCost?: number;
  locale?: Locale;
  selectedRal?: string;
  selectedRalLabel?: string;
  layoutImageBase64?: string;
};

export async function generateQuotationPdf(data: QuotationData): Promise<void> {
  const {
    price,
    pillar,
    rows,
    fenceHeightCm,
    baseConcreteColor,
    panelOrientation,
    textureSide,
    deliveryCity,
    deliveryDistanceKm,
    deliveryTrucks,
    deliveryCost,
    locale = 'en',
    selectedRal,
    selectedRalLabel,
    layoutImageBase64,
  } = data;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;

  const t = (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations.en?.[key] ?? key;

  const safe = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    return String(value);
  };

  const drawWrappedText = (
    text: unknown,
    x: number,
    y: number,
    maxWidth: number,
    options?: Parameters<typeof doc.text>[3]
  ) => {
    const lines = doc.splitTextToSize(safe(text), maxWidth);
    doc.text(lines, x, y, options);
    return Array.isArray(lines) ? lines.length : 1;
  };

  const isWhite = baseConcreteColor !== 'grey';

  const resolvedTextureSide =
    textureSide ??
    (panelOrientation === 'inward' ? 'inward' : 'outward');

  const textureSideLabel =
    resolvedTextureSide === 'double'
      ? t('quotationTextureDouble')
      : resolvedTextureSide === 'inward'
      ? t('quotationTextureInward')
      : t('quotationTextureOutward');

  let logoH = 14;
  let logoW = 42;

  try {
    const logoBase64 = await imageUrlToBase64('/euromuro_logo.jpg');
    const imgProps = doc.getImageProperties(logoBase64);
    const maxW = 42;
    const maxH = 14;
    const ratio = Math.min(maxW / imgProps.width, maxH / imgProps.height);

    logoW = imgProps.width * ratio;
    logoH = imgProps.height * ratio;

    doc.addImage(logoBase64, imgProps.fileType || 'JPEG', margin, 10, logoW, logoH);
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(BRAND_RED);
    doc.text('EUROMURO', margin, 22);
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  drawWrappedText(t('tagline'), margin, 10 + logoH + 4, 90);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  const companyLines = [
    'EuroMuro Lda',
    'R. Zona Industrial 1111a,',
    'Miranda do Corvo 3220-119, Portugal',
  ];
  companyLines.forEach((line, i) => {
    const text = safe(line);
    const tw = doc.getTextWidth(text);
    doc.text(text, pageW - margin - tw, 13 + i * 4);
  });

  const dividerY = 34;
  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, dividerY, pageW - margin, dividerY);

  const headerY = dividerY + 4;
  doc.setFillColor(BRAND_RED);
  doc.rect(margin, headerY, 3, 9, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_RED);
  const quoteNum = `QUO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
  doc.text(`${t('quotationTitle')}  ${quoteNum}`, margin + 6, headerY + 7);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);

  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 10);

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const dateStr = `${t('quotationDateLabel')}: ${fmtDate(today)}`;
  const expiryStr = `${t('quotationExpiresLabel')}: ${fmtDate(expiry)}`;

  doc.text(dateStr, pageW - margin - doc.getTextWidth(dateStr), headerY + 4);
  doc.text(expiryStr, pageW - margin - doc.getTextWidth(expiryStr), headerY + 9);

  const customY = headerY + 14;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(80, 80, 80);

  const customLines = drawWrappedText(
    t('quotationCustomText'),
    margin,
    customY,
    pageW - margin * 2
  );

  const lineHeight = 4.2;
  const configY = customY + customLines * lineHeight + 6;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, configY, pageW - margin * 2, 20, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(BRAND_RED);
  doc.text(t('quotationFenceConfig'), margin + 4, configY + 6);

  const heightLabel = `${fenceHeightCm} cm`;
  const lengthLabel = `${price.totalLengthM} m`; // Added length calculation
  const colorLabel = selectedRalLabel
    ? `${selectedRalLabel} (${baseConcreteColor === 'white' ? t('quotationColorWhite') : t('quotationColorGrey')} + painting)`
    : baseConcreteColor === 'grey'
    ? t('quotationColorGrey')
    : t('quotationColorWhite');

  // Included Length in the configuration display
  const configCols = [
    { label: safe(t('quotationLength')), value: safe(lengthLabel) },
    { label: safe(t('quotationHeight')), value: safe(heightLabel) },
    { label: safe(t('quotationColor')), value: safe(colorLabel) },
    { label: safe(t('quotationTextureSide')), value: safe(textureSideLabel) },
  ];

  const colW = (pageW - margin * 2 - 8) / configCols.length;
  configCols.forEach((col, i) => {
    const cx = margin + 4 + i * colW;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(120, 120, 120);
    doc.text(safe(col.label), cx, configY + 11);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(BRAND_BLACK);

    const lines = doc.splitTextToSize(safe(col.value), colW - 4);
    doc.text(lines, cx, configY + 16);
  });

  const tableRows: (string | number)[][] = [];

  price.rowBreakdown.forEach((row) => {
    if (row.count > 0) {
      const unitPrice = row.price;
      const ref = rows.find(r => r.panel.label === row.label)?.panel.reference ?? '';
      tableRows.push([
        ref ? `${safe(row.label)}\n${safe(ref)}` : safe(row.label),
        row.count,
        `${safe(unitPrice)} €/m²`,
        '23%',
        `${safe(row.total)} €`,
      ]);
    }
  });

  const pillarPrice = isWhite ? pillar.priceWhite : pillar.price;
  const pillarRef = (pillar as any).reference ?? '';
  const pillarName = `${pillar.style === 'smooth' ? t('quotationPillarSmooth') : t('quotationPillarWoodlike')} ${pillar.heightCm}cm`;

  tableRows.push([
    pillarRef ? `${safe(pillarName)}\n${safe(pillarRef)}` : safe(pillarName),
    price.postCount,
    `${safe(pillarPrice)} €/unit`,
    '23%',
    `${safe(price.postTotal)} €`,
  ]);

  if (price.paintingTotal > 0) {
    const paintingRate = price.paintedAreaM2 > 0
      ? Math.round((price.paintingTotal / price.paintedAreaM2) * 100) / 100
      : 0;

    const paintingLabel = selectedRalLabel
      ? `${t('paintingService')} (${selectedRalLabel})`
      : `${t('paintingService')}`;

    tableRows.push([
      paintingLabel,
      `${safe(price.paintedAreaM2)} m²`,
      `${safe(paintingRate)} €/m²`,
      '23%',
      `${safe(price.paintingTotal)} €`,
    ]);
  }

  if (deliveryCity && deliveryCost) {
    const cityName = safe(deliveryCity.displayName.split(',')[0]);
    const trucksLabel =
      deliveryTrucks && deliveryTrucks > 0
        ? ` (${t('sideBarTrucks')} x ${deliveryTrucks})`
        : '';

    tableRows.push([
      `${t('quotationDeliveryLabel')} — ${cityName}${trucksLabel}`,
      1,
      `${safe(deliveryCost)} €`,
      '23%',
      `${safe(deliveryCost)} €`,
    ]);
  }

  autoTable(doc, {
    startY: configY + 24,
    head: [[t('quotationItems'), t('quotationUnitQty'), t('quotationUnitPrice'), t('quotationTaxShort'), t('quotationTotal')]],
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
      0: { cellWidth: 76 },
      1: { cellWidth: 18, halign: 'center' },
      2: { cellWidth: 32, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  // Changed to `let` so we can adjust it if delivery disclaimer is added
  let afterTable = (doc as any).lastAutoTable.finalY + 6;

  // New logic: Check for delivery and add the disclaimer
  if (deliveryCity && deliveryCost) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(BRAND_RED);
    
    // Uses the new translation key with a fallback just in case it isn't in i18n yet
    const translationKeyRaw = t('quotationAutoDeliveryWarning' as TranslationKey);
    const warningText = `* ${translationKeyRaw === 'quotationAutoDeliveryWarning' 
      ? t('quotationDeliveryAdditional')
      : translationKeyRaw}`;
      
    const lines = doc.splitTextToSize(warningText, pageW - margin * 2);
    doc.text(lines, margin, afterTable + 2);
    
    // Push the total block down based on how many lines the disclaimer took
    afterTable += (lines.length * 4) + 4; 
  }

  const deliveryTotal = deliveryCity && deliveryCost ? deliveryCost : 0;
  const subtotal = Math.round(
    (price.panelTotal + price.postTotal + price.paintingTotal + deliveryTotal) * 100
  ) / 100;
  const taxAmount = Math.round(subtotal * TAX_RATE * 100) / 100;
  const grandTotal = Math.round((subtotal + taxAmount) * 100) / 100;

  const totalBlockX = pageW - margin - 84;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(totalBlockX, afterTable, 84, 24, 2, 2, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text(`${t('quotationTotalNoTax')}:`, totalBlockX + 4, afterTable + 8);
  doc.text(`${t('quotationTax')}:`, totalBlockX + 4, afterTable + 16);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(BRAND_BLACK);
  doc.text(`${subtotal} €`, totalBlockX + 80, afterTable + 8, { align: 'right' });
  doc.text(`${taxAmount} €`, totalBlockX + 80, afterTable + 16, { align: 'right' });

  doc.setFillColor(BRAND_RED);
  doc.roundedRect(totalBlockX, afterTable + 26, 84, 12, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor('#ffffff');
  doc.text(t('quotationTotal').toUpperCase(), totalBlockX + 4, afterTable + 34);
  doc.text(`${grandTotal} €`, totalBlockX + 80, afterTable + 34, { align: 'right' });

  const extraY = afterTable + 44;
  const extraRows: [string, string][] = [
    [safe(t('quotationWeight')), `${safe(price.totalWeightKg)} kg`],
    [safe(t('quotationLength')), `${safe(price.totalLengthM)} m`],
    [`${safe(t('quotationPanels'))} qty`, `${safe(price.panelCount)} pcs`],
    [`${safe(t('quotationPillars'))} qty`, `${safe(price.postCount)} pcs`],
  ];

  const extraBoxH = extraRows.length * 6 + 10;
  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, extraY, 90, extraBoxH, 2, 2, 'F');

  doc.setDrawColor(BRAND_RED);
  doc.setLineWidth(2);
  doc.line(margin, extraY + 4, margin, extraY + extraBoxH - 4);
  doc.setLineWidth(0.3);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  extraRows.forEach(([label, value], i) => {
    const ry = extraY + 8 + i * 6;
    doc.setTextColor(100, 100, 100);
    doc.text(safe(label), margin + 5, ry);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_BLACK);
    doc.text(safe(value), margin + 85, ry, { align: 'right' });
    doc.setFont('helvetica', 'normal');
  });

  const termsY = extraY + extraBoxH + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t('quotationTerms')}:`, margin, termsY);

  const termsUrl = 'https://euromuro.odoo.com/terms';
  doc.setTextColor(BRAND_RED);
  doc.textWithLink(termsUrl, margin + 40, termsY, { url: termsUrl });

  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

  const footerY = pageH - 8;
  const website = 'https://euromuro.eu';
  const email = 'info@euromuro.eu';
  const vat = 'PT517982480';

  const phone = safe(t('phoneNumber' as TranslationKey));
  const phoneEs = safe(t('phoneNumberEs' as TranslationKey));

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);

  let x = margin;

  doc.setTextColor(BRAND_RED);
  doc.textWithLink(website, x, footerY, { url: website });
  x += doc.getTextWidth(website) + 4;

  doc.setTextColor(150, 150, 150);
  doc.text('|', x, footerY);
  x += 4;

  doc.setTextColor(BRAND_RED);
  doc.textWithLink(email, x, footerY, { url: `mailto:${email}` });
  x += doc.getTextWidth(email) + 4;

  doc.setTextColor(150, 150, 150);
  doc.text('|', x, footerY);
  x += 4;

if (phone) {
    doc.setTextColor(BRAND_RED);
    // Делаем телефон кликабельным через tel: (очищаем от пробелов для ссылки)
    const phoneUrl = `tel:${phone.replace(/[^0-9+]/g, '')}`; 
    doc.textWithLink(phone, x, footerY, { url: phoneUrl });
    x += doc.getTextWidth(phone) + 4;

    doc.setTextColor(150, 150, 150);
    doc.text('|', x, footerY);
    x += 4;
  }

  if (phoneEs) {
    doc.setTextColor(BRAND_RED);
    // Делаем телефон кликабельным через tel: (очищаем от пробелов для ссылки)
    const phoneUrlEs = `tel:${phone.replace(/[^0-9+]/g, '')}`; 
    doc.textWithLink(phoneEs, x, footerY, { url: phoneUrlEs });
    x += doc.getTextWidth(phoneEs) + 4;

    doc.setTextColor(150, 150, 150);
    doc.text('|', x, footerY);
    x += 4;
  }

  doc.setTextColor(150, 150, 150);
  doc.text(vat, x, footerY);

  const generatedBy = safe(t('quotationGeneratedBy'));
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const generatedByWidth = doc.getTextWidth(generatedBy);
  doc.text(generatedBy, (pageW - generatedByWidth) / 2, pageH - 3.5);

  const pageLabel = safe(t('quotationPageLabel'))
    .replace('{current}', '1')
    .replace('{total}', '1');

  doc.setFontSize(7.5);
  const pageNumTw = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, pageW - margin - pageNumTw, footerY);

  await renderFenceSegmentPage({
    doc,
    price,
    pillar,
    rows,
    fenceHeightCm,
    baseConcreteColor,
    selectedRal,
    locale,
    layoutImageBase64,
  });

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