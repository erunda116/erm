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
  locale?: Locale;
};

export async function renderFenceSegmentPage({
  doc,
  price,
  pillar,
  rows,
  fenceHeightCm,
  locale = 'en',
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
  });
  drawFooter(doc, pageW, pageH, margin, t);
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

    doc.addImage(
      logoBase64,
      imgProps.fileType || 'JPEG',
      margin,
      10,
      logoW,
      logoH
    );
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
  }: {
    pageW: number;
    pageH: number;
    margin: number;
    price: PriceSummary;
    pillar: PillarModel;
    rows: FenceRow[];
    fenceHeightCm: number;
    locale: Locale;
  }
): Promise<void> {
  const t = (key: TranslationKey): string =>
    translations[locale]?.[key] ?? translations.en?.[key] ?? key;

  const titleY = 48;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(BRAND_RED);
  doc.text( t('segmentPreview'), margin, titleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${fenceHeightCm} cm`, margin, titleY + 6);

  const segmentCount = getSegmentCount(price.totalLengthM, 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(BRAND_RED);
  doc.text(`x ${segmentCount}`, pageW - margin, titleY + 2, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text(`${price.totalLengthM} m total`, pageW - margin, titleY + 8, {
    align: 'right',
  });

  const boxY = 64;
  const boxH = 160;
  const boxW = pageW - margin * 2;

  doc.setFillColor(LIGHT_GRAY);
  doc.roundedRect(margin, boxY, boxW, boxH, 3, 3, 'F');

  const totalCm = Math.max(
    rows.reduce((sum, row) => sum + row.heightCm, 0),
    1
  );

  const segmentBottomY = boxY + boxH - 18;
  const panelTotalH = Math.min(120, (fenceHeightCm / 200) * 120);

  const pillarPath = getPillarImagePath(pillar);
  const pillarImg = await imageUrlToBase64(pillarPath);
  const pillarFormat = getImageFormatFromPath(pillarPath);

  const pillarW = 8;
  const pillarH = panelTotalH;

  const leftPillarX = margin + 26;
  const leftPillarY = segmentBottomY - pillarH;

  const panelX = leftPillarX + pillarW;
  const panelY = segmentBottomY - panelTotalH;

  const panelW = pageW - margin * 2 - 52 - pillarW * 2;

  const rightPillarX = panelX + panelW;
  const rightPillarY = leftPillarY;

  doc.addImage(
    pillarImg,
    pillarFormat,
    leftPillarX,
    leftPillarY,
    pillarW,
    pillarH
  );

  doc.addImage(
    pillarImg,
    pillarFormat,
    rightPillarX,
    rightPillarY,
    pillarW,
    pillarH
  );

  let currentBottom = segmentBottomY;

  for (const row of rows) {
    const panelPath = getPanelImagePath(row);
    const panelImg = await imageUrlToBase64(panelPath);
    const panelFormat = getImageFormatFromPath(panelPath);
    const rowH = (row.heightCm / totalCm) * panelTotalH;

    doc.addImage(
      panelImg,
      panelFormat,
      panelX,
      currentBottom - rowH,
      panelW,
      rowH
    );

    currentBottom -= rowH;
  }

  const infoY = boxY + boxH + 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(`${t('quotationLength')}: ${price.totalLengthM} m`, margin, infoY);
  doc.text(`${t('quotationWeight')}: ${price.totalWeightKg} kg`, margin, infoY + 6);
  doc.text(`Segments: ${segmentCount}`, margin, infoY + 12);
}

function drawFooter(
  doc: jsPDF,
  pageW: number,
  pageH: number,
  margin: number,
  t: (key: TranslationKey) => string
) {
  const website = 'https://euromuro.eu';
  const email = 'info@euromuro.eu';
  const vat = 'PT517982480';

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