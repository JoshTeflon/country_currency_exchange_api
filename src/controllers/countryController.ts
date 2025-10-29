import { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';

import * as svc from '../services/countryService';
import { getSummaryImagePath } from '../utils/imageGenerator';

export async function postRefresh(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await svc.refreshAllCountries();
    return res.status(200).json(result);
  } catch (err: any) {
    return next(err);
  }
}

export async function getCountries(req: Request, res: Response, next: NextFunction) {
  try {
    const { region, currency, sort } = req.query;
    const data = await svc.listCountries({
      region: region ? String(region) : undefined,
      currency: currency ? String(currency) : undefined,
      sort: sort ? String(sort) : undefined
    });
    return res.status(200).json(data);
  } catch (err) {
    return next(err);
  }
}

export async function getCountry(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.params;
    const country = await svc.getCountryByName(name);
    if (!country) return res.status(404).json({ error: 'Country not found' });
    return res.status(200).json(country);
  } catch (err) {
    return next(err);
  }
}

export async function deleteCountry(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.params;
    const ok = await svc.deleteCountryByName(name);
    if (!ok) return res.status(404).json({ error: 'Country not found' });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
}

export async function getStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const status = await svc.getStatus();
    return res.status(200).json(status);
  } catch (err) {
    return next(err);
  }
}

export function getImage(req: Request, res: Response, next: NextFunction) {
  try {
    const imgPath = getSummaryImagePath();
    if (!fs.existsSync(imgPath)) {
      return res.status(404).json({ error: 'Summary image not found' });
    }
    return res.sendFile(require('node:path').resolve(imgPath));
  } catch (err) {
    return next(err);
  }
}
