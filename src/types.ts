export interface ICurrency {
  code: string;
  name: string;
  symbol: string;
}

export interface ICountryDataExternal {
  name: string;
  capital?: string;
  region?: string;
  population: number;
  flag: string;
  currencies?: ICurrency[];
}

export interface ICountry {
  id: number;
  name: string;
  capital: string | null;
  region: string | null;
  population: number;
  currency_code: string | null;
  exchange_rate: number | null;
  estimated_gdp: number | null;
  flag_url: string;
  last_refreshed_at: Date;
}

export type NewCountry = Omit<ICountry, 'id'>;

export interface IStatus {
  total_countries: number;
  last_refreshed_at: string | null;
  image_svg_base64: string | null; // Stores the Base64 encoded SVG summary image
}

export interface IValidationError {
  [key: string]: string;
}

export interface IAppError extends Error {
  status: number;
  details?: IValidationError | string;
}

export interface IErrorResponse {
  error: string;
  details?: IValidationError | string;
}