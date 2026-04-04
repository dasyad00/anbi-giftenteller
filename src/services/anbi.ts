import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const ANBI_URL = 'https://download.belastingdienst.nl/data/anbi/anbi.zip';
const CACHE_KEY = 'anbi-data';
const CACHE_TIMESTAMP_KEY = 'anbi-data-timestamp';

const fetchData = async () => {
  const response = await fetch(ANBI_URL);
  const blob = await response.blob();
  const zip = await JSZip.loadAsync(blob);
  const xmlFile = zip.file('anbi.xml');
  if (!xmlFile) {
    throw new Error('anbi.xml not found in the zip file');
  }
  const xmlContent = await xmlFile.async('text');
  const parser = new XMLParser();
  const jsonData = parser.parse(xmlContent);
  return jsonData;
};

export const getAnbiData = async (forceRefresh: boolean = false) => {
  const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
  const now = new Date().getTime();

  if (
    !forceRefresh &&
    cachedTimestamp &&
    now - parseInt(cachedTimestamp, 10) < 24 * 60 * 60 * 1000
  ) {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      return JSON.parse(cachedData);
    }
  }

  const data = await fetchData();
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
  return data;
};
