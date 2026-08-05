import type { jsPDF } from 'jspdf';
import type { PriceSummary } from './pricing';
import type { PillarModel } from '../data/posts';
import type { FenceRow } from '../store/useDesignerStore';
import { translations } from './i18n';
import type { Locale, TranslationKey } from './i18n';

const BRAND_RED = '#d3001b';
const LIGHT_GRAY = '#f5f5f5';
const MID_GRAY = '#e8e8e8';

type FenceSegmentPageData = {
  doc: jsPDF;
  price: PriceSummary;
  pillar: PillarModel;
  rows: FenceRow[];
  fenceHeightCm: number;
  baseConcreteColor: 'grey' | 'white';
  selectedRal?: string;
  locale?: Locale;
  layoutImageBase64?: string;
};

export async function renderFenceSegmentPage({
  doc,
  price,
  pillar,
  rows,
  fenceHeightCm,
  baseConcreteColor,
  selectedRal,
  locale = 'en',
  layoutImageBase64,
}: FenceSegmentPageData): Promise<void> {
  doc.addPage();

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;

  const t = (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations.en?.[key] ?? key;

  await drawHeader(doc, pageW, margin, t);
  await drawSegmentBody(doc, {
    pageW,
    pageH,
    margin,
    price,
    pillar,
    rows,
    fenceHeightCm,
    locale,
    baseConcreteColor,
    selectedRal,
    layoutImageBase64,
  });
  
  await drawFooter(doc, pageW, pageH, margin, t);
}

async function drawHeader(
  doc: jsPDF,
  pageW: number,
  margin: number,
  t: (key: TranslationKey) => string
): Promise<void> {
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

    // Added alias 'LOGO' and 'FAST' compression
    doc.addImage(logoBase64, imgProps.fileType || 'JPEG', margin, 10, logoW, logoH, 'LOGO', 'FAST');
  } catch {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(BRAND_RED);
    doc.text('EUROMURO', margin, 22);
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(t('tagline'), margin, 10 + logoH + 4);

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

  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, 34, pageW - margin, 34);
}

async function drawSegmentBody(
  doc: jsPDF,
  {
    pageW,
    pageH,
    margin,
    price,
    pillar,
    rows,
    fenceHeightCm,
    locale,
    baseConcreteColor,
    selectedRal,
    layoutImageBase64,
  }: {
    pageW: number;
    pageH: number;
    margin: number;
    price: PriceSummary;
    pillar: PillarModel;
    rows: FenceRow[];
    fenceHeightCm: number;
    locale: Locale;
    baseConcreteColor: 'grey' | 'white';
    selectedRal?: string;
    layoutImageBase64?: string;
  }
): Promise<void> {
  const t = (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations.en?.[key] ?? key;
  const tint = getConcreteTint(baseConcreteColor, selectedRal);

  // --- Segment Header ---
  const titleY = 44;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_RED);
  doc.text(t('segmentPreview'), margin, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${fenceHeightCm} cm`, margin, titleY + 6);

  const segmentCount = getSegmentCount(price.totalLengthM, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(BRAND_RED);
  doc.text(`x ${segmentCount}`, pageW - margin, titleY + 2, { align: 'right' });

  // --- Person and Proportions ---
  let personImgBase64 = '';
  let personW = 0;
  let personH = 0;
  
  const panelTotalH = Math.min(75, (fenceHeightCm / 200) * 75); 
  
  try {
    personImgBase64 = await imageUrlToBase64('/person.png');
    const personProps = doc.getImageProperties(personImgBase64);
    
    const pdfScale = panelTotalH / fenceHeightCm;
    
    personH = 170 * pdfScale;
    personW = personH * (personProps.width / personProps.height);
  } catch (err) {
    console.warn('Could not add person.png to PDF:', err);
  }

  // --- Segment Frame ---
  const segmentBoxW = 130; 
  const gapPerson = 8; 
  
  const totalVisualW = segmentBoxW + (personImgBase64 ? gapPerson + personW : 0);
  const segmentBoxX = (pageW - totalVisualW) / 2;
  
  const boxY = 56;
  const boxH = 95; 

  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(segmentBoxX, boxY, segmentBoxW, boxH, 3, 3, 'F');

  const totalCm = Math.max(
    rows.reduce((sum, row) => sum + row.heightCm, 0),
    1
  );

  const segmentBottomY = boxY + boxH - 12;

  const pillarPath = getPillarImagePath(pillar);
  const pillarImg = await imageUrlToBase64(pillarPath);
  const pillarFormat = getImageFormatFromPath(pillarPath);

  const pillarW = 6; 
  const pillarH = panelTotalH;

  const leftPillarX = segmentBoxX + 16; 
  const leftPillarY = segmentBottomY - pillarH;
  const panelX = leftPillarX + pillarW;
  const panelW = segmentBoxW - 32 - pillarW * 2; 
  const rightPillarX = panelX + panelW;
  const rightPillarY = leftPillarY;

  // Added alias (pillarPath) to ensure jsPDF only embeds the pillar once!
  doc.addImage(pillarImg, pillarFormat, leftPillarX, leftPillarY, pillarW, pillarH, pillarPath, 'FAST');
  paintRect(doc, leftPillarX, leftPillarY, pillarW, pillarH, tint);
  doc.addImage(pillarImg, pillarFormat, rightPillarX, rightPillarY, pillarW, pillarH, pillarPath, 'FAST');
  paintRect(doc, rightPillarX, rightPillarY, pillarW, pillarH, tint);

  let currentBottom = segmentBottomY;
  for (const row of rows) {
    const panelPath = getPanelImagePath(row);
    const panelImg = await imageUrlToBase64(panelPath);
    const panelFormat = getImageFormatFromPath(panelPath);
    const rowH = (row.heightCm / totalCm) * panelTotalH;

    // Added alias (panelPath) so repeated panels don't inflate the file size!
    doc.addImage(panelImg, panelFormat, panelX, currentBottom - rowH, panelW, rowH, panelPath, 'FAST');
    paintRect(doc, panelX, currentBottom - rowH, panelW, rowH, tint);

    currentBottom -= rowH;
  }

  if (personImgBase64) {
    doc.addImage(personImgBase64, 'PNG', segmentBoxX + segmentBoxW + gapPerson, segmentBottomY - personH, personW, personH, 'PERSON', 'FAST');
  }

  // --- 2D Layout Frame ---
  const frameY = boxY + boxH + 8;
  const frameH = 75; 
  const fullWidth = pageW - margin * 2;
  
  if (layoutImageBase64) {
    try {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(BRAND_RED);
      const planViewTitle = t('quotationPlanView' as TranslationKey) || '2D PLAN VIEW';
      doc.text(planViewTitle, margin, frameY - 2);

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(MID_GRAY);
      doc.setLineWidth(0.4);
      doc.roundedRect(margin, frameY, fullWidth, frameH, 2, 2, 'FD');

      const imgProps = doc.getImageProperties(layoutImageBase64);
      const padding = 2;
      const maxImgW = fullWidth - padding * 2;
      const maxImgH = frameH - padding * 2;
      
      const ratio = Math.min(maxImgW / imgProps.width, maxImgH / imgProps.height);
      const finalW = imgProps.width * ratio;
      const finalH = imgProps.height * ratio;
      
      const imgX = margin + (fullWidth - finalW) / 2;
      const imgY = frameY + (frameH - finalH) / 2;
      
      // Defaulting to JPEG and using FAST compression
      doc.addImage(layoutImageBase64, imgProps.fileType || 'JPEG', imgX, imgY, finalW, finalH, '3D_LAYOUT', 'FAST');
    } catch (err) {
      console.warn('Could not add 2D layout image to PDF:', err);
    }
  }

  // --- Footer Text ---
  const textUnderPlanY = frameY + frameH + 6;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);

  const planLine1 = t('planDescription1' as TranslationKey) || 'Important layout information and mounting details. Please verify dimensions and boundary points carefully. Final execution may slightly vary depending on terrain.';

  const maxTextWidth = pageW - margin * 2;
  const splitText = doc.splitTextToSize(planLine1, maxTextWidth);
  doc.text(splitText, margin, textUnderPlanY);

  const textBlockHeight = splitText.length * 4;
  const infoY = textUnderPlanY + textBlockHeight + 8;
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  
  doc.text(`${t('quotationLength').toUpperCase()}: ${price.totalLengthM} m`, margin, infoY);
  doc.text(`${t('quotationWeight').toUpperCase()}: ${price.totalWeightKg} kg`, margin, infoY + 5);
  doc.text(`SEGMENTS: ${segmentCount}`, margin, infoY + 10);

  const termsY = infoY + 17;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(`${t('quotationTerms')}:`, margin, termsY);

  const termsUrl = 'https://euromuro.odoo.com/terms';
  doc.setTextColor(BRAND_RED);
  doc.textWithLink(termsUrl, margin + doc.getTextWidth(`${t('quotationTerms')}: `) + 1, termsY, { url: termsUrl });
}

async function drawFooter(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  t: (key: TranslationKey) => string
) {
  try {
    const qrBase64 = await imageUrlToBase64('/qr.png');
    const qrSize = 18;
    const qrX = pageW - margin - qrSize;
    const qrY = pageH - 14 - 4 - qrSize; 
    // Added alias and FAST compression
    doc.addImage(qrBase64, 'PNG', qrX, qrY, qrSize, qrSize, 'QR_CODE', 'FAST');
  } catch (err) {
    console.warn('Could not load qr.png', err);
  }

  const website = 'https://euromuro.eu';
  const email = 'info@euromuro.eu';
  const vat = 'PT517982480';
  
  const phone = t('phoneNumber' as TranslationKey);
  const phoneEs = t('phoneNumberEs' as TranslationKey);

  doc.setDrawColor(MID_GRAY);
  doc.setLineWidth(0.3);
  doc.line(margin, pageH - 14, pageW - margin, pageH - 14);

  const footerY = pageH - 8;
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

  if (phone && phone !== 'phoneNumber') {
    doc.setTextColor(BRAND_RED);
    const phoneUrl = `tel:${phone.replace(/[^0-9+]/g, '')}`; 
    doc.textWithLink(phone, x, footerY, { url: phoneUrl });
    x += doc.getTextWidth(phone) + 4;
    doc.setTextColor(150, 150, 150);
    doc.text('|', x, footerY);
    x += 4;
  }

  if (phoneEs && phoneEs !== 'phoneNumberEs') {
    doc.setTextColor(BRAND_RED);
    const phoneUrlEs = `tel:${phoneEs.replace(/[^0-9+]/g, '')}`; 
    doc.textWithLink(phoneEs, x, footerY, { url: phoneUrlEs });
    x += doc.getTextWidth(phoneEs) + 4;
    doc.setTextColor(150, 150, 150);
    doc.text('|', x, footerY);
    x += 4;
  }

  doc.setTextColor(150, 150, 150);
  doc.text(vat, x, footerY);

  const generatedBy = t('quotationGeneratedBy');
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  const generatedByWidth = doc.getTextWidth(generatedBy);
  doc.text(generatedBy, (pageW - generatedByWidth) / 2, pageH - 3.5);

  const pageLabel = t('quotationPageLabel')
    .replace('{current}', '2')
    .replace('{total}', '2');

  doc.setFontSize(7.5);
  const pageNumTw = doc.getTextWidth(pageLabel);
  doc.text(pageLabel, pageW - margin - pageNumTw, footerY);
}

function getSegmentCount(totalLengthM: number, segmentWidthM = 2): number {
  if (!totalLengthM || totalLengthM <= 0) return 0;
  return Math.max(1, Math.round(totalLengthM / segmentWidthM));
}

function getPillarImagePath(pillar: PillarModel): string {
  const style = pillar.style.toLowerCase();
  const h = pillar.heightCm;
  return `/pdf-segment/pillars/${style}-${h}.png`;
}

function getPanelImagePath(row: FenceRow): string {
  const id = row.panel.id.toLowerCase();
  const h = row.heightCm;
  return `/pdf-segment/panels/${id}-${h}.png`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized;

  const num = parseInt(full, 16);

  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function getConcreteTint(
  baseConcreteColor: 'grey' | 'white',
  selectedRal?: string
): { r: number; g: number; b: number; opacity: number } {
  if (selectedRal) {
    const { r, g, b } = hexToRgb(selectedRal);
    return { r, g, b, opacity: 0.66 };
  }

  if (baseConcreteColor === 'white') {
    return { r: 245, g: 242, b: 236, opacity: 0.22 };
  }

  return { r: 120, g: 120, b: 120, opacity: 0.18 };
}

function paintRect(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: { r: number; g: number; b: number; opacity: number }
) {
  doc.saveGraphicsState();

  if ((doc as any).setGState && (doc as any).GState) {
    (doc as any).setGState(new (doc as any).GState({ opacity: fill.opacity }));
  }

  doc.setFillColor(fill.r, fill.g, fill.b);
  doc.rect(x, y, w, h, 'F');

  doc.restoreGraphicsState();
}

function getImageFormatFromPath(path: string): 'PNG' | 'JPEG' {
  const lower = path.toLowerCase();
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'JPEG';
  return 'PNG';
}

async function imageUrlToBase64(url: string): Promise<string> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load image: ${url}`);
  }

  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}