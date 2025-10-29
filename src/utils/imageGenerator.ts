import fs from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import prisma from '../lib/prisma';
import { ICountry } from '../types';

const SUMMARY_PATH = process.env.SUMMARY_IMAGE_PATH ?? './cache/summary.png';

function escapeXml(s: string) {
  return s.replaceAll(/[&<>'"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&apos;','"':'&quot;' }[c]!));
}

function createSvg(total: number, rows: { name: string; estimated_gdp: number }[], ts: string) {
  const width = 1000;
  const height = 600;
  const header = `<text x="40" y="60" font-size="28" fill="#111827">Countries Summary</text>`;
  const totalText = `<text x="40" y="100" font-size="18" fill="#374151">Total countries: ${total}</text>`;
  const rowsSvg = rows.map((r, i) => `<text x="40" y="${150 + i * 36}" font-size="18" fill="#111827">${i+1}. ${escapeXml(r.name)} — ${Math.round(r.estimated_gdp).toLocaleString()}</text>`).join('');
  const footer = `<text x="40" y="${height-40}" font-size="14" fill="#6b7280">Last refresh: ${ts}</text>`;

  return `
  <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
    <rect width="100%" height="100%" fill="#fff"/>
    ${header}
    ${totalText}
    ${rowsSvg}
    ${footer}
  </svg>
  `;
}

export async function generateAndSaveSummaryImage(lastRefreshedAtISO: string) {
  // get top 5 by estimated_gdp (non-null)
  const top5 = await prisma.country.findMany({
    where: { estimated_gdp: { not: null } },
    orderBy: { estimated_gdp: 'desc' },
    take: 5,
    select: { name: true, estimated_gdp: true }
  });

  const total = await prisma.country.count();

  const svg = createSvg(total, top5.map((t: ICountry) => ({ name: t.name, estimated_gdp: t.estimated_gdp ?? 0 })), lastRefreshedAtISO);

  const outDir = path.dirname(SUMMARY_PATH);
  await fs.mkdir(outDir, { recursive: true });

  // convert SVG to PNG with sharp
  await sharp(Buffer.from(svg)).png().toFile(SUMMARY_PATH);

  // Optionally return svg/base64 for status
  return Buffer.from(svg).toString('base64');
}

export function getSummaryImagePath() {
  return SUMMARY_PATH;
}
