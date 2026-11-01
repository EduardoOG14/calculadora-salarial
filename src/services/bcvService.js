import AsyncStorage from '@react-native-async-storage/async-storage';

const BCV_CACHE_KEY = '@salary_calc_bcv_rate_v1';
const BCV_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial';

// Tasa de reserva por defecto en caso de no haber internet en el primer inicio
const DEFAULT_FALLBACK_RATE = 887.30;

/**
 * Obtiene la tasa BCV guardada en caché local
 */
export async function getCachedBcvRate() {
  try {
    const raw = await AsyncStorage.getItem(BCV_CACHE_KEY);
    if (!raw) {
      return {
        rate: DEFAULT_FALLBACK_RATE,
        date: null,
        lastFetched: null,
        isDefault: true,
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al leer caché BCV:', e);
    return {
      rate: DEFAULT_FALLBACK_RATE,
      date: null,
      lastFetched: null,
      isDefault: true,
    };
  }
}

/**
 * Consulta la tasa oficial del Banco Central de Venezuela en tiempo real
 */
export async function fetchLiveBcvRate() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000); // 7s timeout

    const response = await fetch(BCV_API_URL, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Error en servidor BCV: ${response.status}`);
    }

    const data = await response.json();
    const rate = Number(data.promedio);

    if (!rate || isNaN(rate) || rate <= 0) {
      throw new Error('Monto de tasa inválido devuelto por la API');
    }

    const cacheData = {
      rate: rate,
      date: data.fechaActualizacion || new Date().toISOString(),
      lastFetched: new Date().toISOString(),
      isDefault: false,
    };

    await AsyncStorage.setItem(BCV_CACHE_KEY, JSON.stringify(cacheData));
    return { success: true, ...cacheData };
  } catch (error) {
    console.log('No se pudo conectar a la API BCV, usando caché local:', error.message);
    const cached = await getCachedBcvRate();
    return { success: false, error: error.message, ...cached };
  }
}

/**
 * Guarda una tasa BCV manual si el usuario desea sobrescribirla
 */
export async function saveManualBcvRate(manualRate) {
  try {
    const rateNum = Math.max(0, parseFloat(manualRate) || 0);
    const cacheData = {
      rate: rateNum,
      date: 'Manual',
      lastFetched: new Date().toISOString(),
      isManual: true,
    };
    await AsyncStorage.setItem(BCV_CACHE_KEY, JSON.stringify(cacheData));
    return cacheData;
  } catch (e) {
    console.error('Error al guardar tasa manual:', e);
    return null;
  }
}
