import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';
import { reportError } from '../lib/rollbar';

const ANBI_URL = 'https://download.belastingdienst.nl/data/anbi/anbi.zip';
const CACHE_KEY = 'anbi-data';
const CACHE_TIMESTAMP_KEY = 'anbi-data-timestamp';

// --- IndexedDB Caching Utility ---
const DB_NAME = 'AnbiCache';
const STORE_NAME = 'file_cache';
const DB_VERSION = 1;

function openDB() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject('IndexedDB not supported');
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getFromDB(key: string) {
  const db = await openDB();
  return new Promise<any>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const request = transaction.objectStore(STORE_NAME).get(key);
    transaction.oncomplete = () => resolve(request.result);
    transaction.onerror = () => reject(transaction.error);
  });
}

async function setToDB(key: string, value: any) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).put(value, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

// --- Data Fetching Logic ---

export interface AnbiMetadata {
  aanmaakDatum: string;
  versie: number;
}

export interface AnbiOrganisationDataset {
  beschikking: AnbiOrganisation[];
  header: AnbiMetadata;
}

export interface AnbiOrganisation {
  dossierNummer: number;
  naam: string;
  aliasNaam?: string;
  ingangsDatum?: string;
  vestigingsPlaats?: string;
  fiscaalNummer?: number;
  webSite?: string;
}

const fetchData = async (): Promise<AnbiOrganisationDataset> => {
  const response = await fetch(ANBI_URL);
  if (!response.ok) {
    throw new Error(`Failed to download ANBI data: ${response.statusText}`);
  }
  const blob = await response.blob();
  const zip = await JSZip.loadAsync(blob);
  const xmlFile = zip.file('anbi.xml');
  if (!xmlFile) {
    throw new Error('anbi.xml not found in the zip file');
  }
  const xmlBytes = await xmlFile.async('uint8array');
  const decoder = new TextDecoder('iso-8859-1');
  const xmlContent = decoder.decode(xmlBytes);

  const parser = new XMLParser({
    // ignoreAttributes: false,
    processEntities: {
      enabled: true,
      maxTotalExpansions: 4000,
    },
  });
  const data = parser.parse(xmlContent);
  return data.publicatieAnbiInstellingen;
};

export const getLastAnbiRefreshTime = async (): Promise<number | null> => {
  try {
    return (await getFromDB(CACHE_TIMESTAMP_KEY)) as number | null;
  } catch (error) {
    // We don't necessarily want to alert Rollbar for a silent cache miss on init,
    // but console logging it is fine.
    console.debug('No previous refresh time found in IndexedDB');
    return null;
  }
};

export const getAnbiData = async (
  forceRefresh: boolean = false,
): Promise<AnbiOrganisationDataset> => {
  const now = new Date().getTime();
  const fifteenMinutes = 15 * 60 * 1000;

  // Try to use IndexedDB first
  try {
    const cachedTimestamp = (await getFromDB(CACHE_TIMESTAMP_KEY)) as number;
    const isRecentlyRefreshed =
      cachedTimestamp && now - cachedTimestamp < fifteenMinutes;

    if (
      (!forceRefresh &&
        cachedTimestamp &&
        now - cachedTimestamp < 24 * 60 * 60 * 1000) ||
      (forceRefresh && isRecentlyRefreshed)
    ) {
      const cachedData = await getFromDB(CACHE_KEY);
      if (cachedData) {
        if (forceRefresh && isRecentlyRefreshed) {
          console.log(
            'Skipping refresh: ANBI data was updated less than 15 minutes ago.',
          );
        } else {
          console.log('Returning cached ANBI data from IndexedDB');
        }
        return cachedData;
      }
    }
  } catch (error) {
    // This is a warning because it's usually just due to private mode,
    // but we report it to Rollbar to see how often it happens.
    reportError(error, {
      message: 'IndexedDB read failed, falling back to network',
      level: 'warning',
    });
  }

  // If cache is invalid, not present, or DB fails, fetch fresh data
  console.log('Fetching fresh ANBI data...');
  const data = await fetchData();

  // Attempt to cache the new data in IndexedDB
  try {
    await setToDB(CACHE_KEY, data);
    await setToDB(CACHE_TIMESTAMP_KEY, now);
    console.log('Cached fresh ANBI data in IndexedDB');
  } catch (error) {
    reportError(error, 'Failed to cache ANBI data in IndexedDB');
  }

  return data;
};
