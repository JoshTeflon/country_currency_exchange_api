import prisma from '../lib/prisma';
import { fetchJson } from '../utils/fetcher';
import { generateAndSaveSummaryImage } from '../utils/imageGenerator';
import { ICountry, ICountryDataExternal, NewCountry } from '../types';

const COUNTRY_API = process.env.COUNTRY_API_URL ?? 'https://restcountries.com/v2/all?fields=name,capital,region,population,flag,currencies';
const EXCHANGE_API = process.env.EXCHANGE_API_URL ?? 'https://open.er-api.com/v6/latest/USD';

function randomMultiplier() {
  return Math.random() * (2000 - 1000) + 1000;
}

/**
 * Refresh countries: fetch both external APIs first, if either fails throw 503 and do NOT modify DB.
 * Then upsert all countries in a transaction.
 */
export async function refreshAllCountries() {
  // fetch both in parallel with timeout behavior handled by axios in fetcher
  let countriesData: ICountryDataExternal[];
  let exchangeData: any;

  try {
    const [cResp, eResp] = await Promise.all([fetchJson(COUNTRY_API), fetchJson(EXCHANGE_API)]);
    countriesData = cResp as ICountryDataExternal[];
    exchangeData = eResp;
  } catch (err: any) {
    // External API failure -> 503
    throw { status: 503, message: err?.message ?? 'Could not fetch external API' };
  }

  if (!Array.isArray(countriesData)) {
    throw { status: 503, message: 'Invalid country data from external API' };
  }

  const rates: Record<string, number> = exchangeData?.rates ?? {};

  const now = new Date();
  const upserts: any[] = [];

  for (const c of countriesData) {
    const currency_code = Array.isArray(c.currencies) && c.currencies.length > 0 && c.currencies[0]?.code ? c.currencies[0].code : null;

    let exchange_rate: number | null = null;
    let estimated_gdp: number | null;

    if (currency_code) {
      exchange_rate = rates[currency_code] ?? null;
      if (exchange_rate === null) {
        estimated_gdp = null;
      } else {
        const multiplier = randomMultiplier();
        estimated_gdp = (Number(c.population ?? 0) * multiplier) / exchange_rate;
      }
    } else {
      estimated_gdp = 0; // per task rules
    }

    const data: NewCountry = {
      name: c.name,
      capital: c.capital ?? null,
      region: c.region ?? null,
      population: Number(c.population ?? 0),
      currency_code,
      exchange_rate,
      estimated_gdp,
      flag_url: c.flag ?? '',
      last_refreshed_at: now
    };

    // Create upsert operation
    upserts.push({
      where: { name: c.name },
      update: {
        capital: data.capital,
        region: data.region,
        population: BigInt(data.population),
        currency_code: data.currency_code,
        exchange_rate: data.exchange_rate,
        estimated_gdp: data.estimated_gdp,
        flag_url: data.flag_url,
        last_refreshed_at: now
      },
      create: {
        name: data.name,
        capital: data.capital,
        region: data.region,
        population: BigInt(data.population),
        currency_code: data.currency_code,
        exchange_rate: data.exchange_rate,
        estimated_gdp: data.estimated_gdp,
        flag_url: data.flag_url,
        last_refreshed_at: now
      }
    });
  }

  // Execute transactionally. If anything fails here, Prisma will rollback.
  try {
    // Prisma doesn't support array-of-upsert in a single $transaction call with upsert operations directly,
    // so perform sequentially inside the transaction function for safety.
    await prisma.$transaction(async (tx: any) => {
      for (const op of upserts) {
        // use case-insensitive match using findFirst with mode 'insensitive'
        const existing = await tx.country.findFirst({
          where: { name: {
            equals: op.where.name,
            // mode: 'insensitive'
          } }
        });

        if (existing) {
          // update by id
          await tx.country.update({
            where: { id: existing.id },
            data: op.update
          });
        } else {
          await tx.country.create({ data: op.create });
        }
      }
    });
  } catch (err: any) {
    console.error('DB transaction failed', err);
    throw { status: 500, message: 'Database update failed' };
  }

  // after successful transaction, generate summary image and save file
  const lastRefreshedISO = now.toISOString();
  const svgBase64 = await generateAndSaveSummaryImage(lastRefreshedISO);

  return { total_countries: upserts.length, last_refreshed_at: lastRefreshedISO, image_svg_base64: svgBase64 };
}

export async function listCountries(filters: {
  region: string | undefined;
  currency: string | undefined;
  sort: string | undefined;
}) {
  const where: any = {};
  if (filters.region) where.region = filters.region;
  if (filters.currency) where.currency_code = filters.currency;

  const orderBy = filters.sort === 'gdp_desc' ? { estimated_gdp: 'desc' } : (filters.sort === 'gdp_asc' ? { estimated_gdp: 'asc' } : undefined);

  const countries = await prisma.country.findMany({
    where,
    orderBy
  });

  // Convert BigInt population to number for JSON
  return countries.map((c: ICountry) => ({
    ...c,
    population: Number(c.population)
  }));
}

export async function getCountryByName(name: string) {
  const country = await prisma.country.findFirst({
    where: { name: {
      equals: name,
      // mode: 'insensitive'
    } }
  });
  if (!country) return null;
  return { ...country, population: Number(country.population) };
}

export async function deleteCountryByName(name: string) {
  const existing = await prisma.country.findFirst({
    where: { name: {
      equals: name,
      // mode: 'insensitive'
    } }
  });
  if (!existing) return false;
  await prisma.country.delete({ where: { id: existing.id } });
  return true;
}

export async function getStatus() {
  const total = await prisma.country.count();
  const last = await prisma.country.findFirst({
    orderBy: { last_refreshed_at: 'desc' },
    select: { last_refreshed_at: true }
  });

  // also read summary image as base64 if exists
  const imgPath = process.env.SUMMARY_IMAGE_PATH ?? './cache/summary.png';
  let imgBase64: string | null = null;
  try {
    const buf = await import('node:fs').then(fs => fs.promises.readFile(imgPath));
    imgBase64 = Buffer.from(buf).toString('base64');
  } catch {
    imgBase64 = null;
  }

  return { total_countries: total, last_refreshed_at: last?.last_refreshed_at?.toISOString() ?? null, image_svg_base64: imgBase64 };
}
