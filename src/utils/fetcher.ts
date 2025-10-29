import axios from 'axios';

const TIMEOUT = Number(process.env.REQUEST_TIMEOUT_MS ?? 15000);

export async function fetchJson(url: string) {
  const res = await axios.get(url, { timeout: TIMEOUT });
  return res.data;
};