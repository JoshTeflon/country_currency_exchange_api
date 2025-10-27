import { Request, Response, NextFunction } from 'express';

import { IAppError, ICountry, IErrorResponse, IValidationError } from "../types";

export const validateCountry = (country: ICountry): IValidationError | null => {
  const errors: IValidationError = {};

  if (!country.name) {
      errors['name'] = 'is required';
  }
  if (typeof country.population !== 'number' || country.population <= 0) {
      errors['population'] = 'must be a positive number';
  }
  
  return Object.keys(errors).length > 0 ? errors : null;
};

export const errorHandler = (err: IAppError, req: Request, res: Response, next: NextFunction) => {
  const status = err.status ?? 500;
  let errorResponse: IErrorResponse = { error: err.message || 'Internal server error' };

  if (err.details) {
    // If it's a validation error, include details
    errorResponse = { error: 'Validation failed', details: err.details };
  } else if (status === 404) {
    errorResponse = { error: 'Country not found' };
  } else if (status === 503) {
    errorResponse = { error: 'External data source unavailable', details: err.message };
  }
  
  if (status >= 500 && status !== 503) {
    console.error(`[${status}]: ${err.stack}`);
  }

  return res.status(status).json(errorResponse);
};