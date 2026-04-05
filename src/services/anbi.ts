import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

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

export interface AnbiOrganisationDataset {
  beschikking: AnbiOrganisation[];
  header: { aanmaakDatum: string; versie: number };
}

export interface AnbiOrganisation {
  dossierNummer: string;
  naam: string;
  aliasNaam?: string;
  ingangsDatum?: string;
  vestigingsPlaats?: string;
  fiscaalNummer?: string;
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

export const getAnbiData = async (
  forceRefresh: boolean = false,
): Promise<AnbiOrganisationDataset> => {
  const now = new Date().getTime();

  // Try to use IndexedDB first
  try {
    const cachedTimestamp = (await getFromDB(CACHE_TIMESTAMP_KEY)) as number;
    if (
      !forceRefresh &&
      cachedTimestamp &&
      now - cachedTimestamp < 24 * 60 * 60 * 1000 // 24-hour cache
    ) {
      const cachedData = await getFromDB(CACHE_KEY);
      if (cachedData) {
        console.log('Returning cached ANBI data from IndexedDB');
        return cachedData;
      }
    }
  } catch (error) {
    console.warn(
      'Could not read from IndexedDB. This might be because it is not supported (e.g., in private browsing mode). Falling back to no cache.',
      error,
    );
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
    console.error('Failed to cache ANBI data in IndexedDB:', error);
    // The app will still work with the in-memory data
  }

  return data;
};
