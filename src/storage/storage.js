import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_SETTINGS } from '../constants/theme';
import { isWeekendDay } from '../utils/calculator';

const SETTINGS_KEY = '@salary_calc_settings_v1';
const RECORDS_PREFIX = '@salary_calc_records_';

/**
 * Cargar configuración guardada
 */
export async function getSettings() {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Error al cargar configuración:', e);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Guardar configuración
 */
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.error('Error al guardar configuración:', e);
    return false;
  }
}

/**
 * Genera la clave para el mes y año específico (mes en base 0: 0 = enero, 9 = octubre)
 */
function getMonthKey(year, month) {
  const padMonth = String(month + 1).padStart(2, '0');
  return `${RECORDS_PREFIX}${year}_${padMonth}`;
}

/**
 * Obtener todos los registros de un mes
 * Estructura devuelta: { [dayNumber]: { isGuardia: bool, isGuardiaCompleta: bool, overtimeHours: number, isWeekend: bool, notes: string } }
 */
export async function getMonthRecords(year, month) {
  try {
    const key = getMonthKey(year, month);
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error al cargar registros del mes:', e);
    return {};
  }
}

/**
 * Guardar o actualizar un día específico
 */
export async function saveDayRecord(year, month, day, dayData) {
  try {
    const currentRecords = await getMonthRecords(year, month);
    
    // Si todos los valores están en cero o falso, podemos eliminar el día para ahorrar espacio
    const isEmpty =
      !dayData.isGuardia &&
      !dayData.isGuardiaCompleta &&
      !dayData.isSpecialPay &&
      (!dayData.overtimeHours || dayData.overtimeHours <= 0) &&
      !dayData.isWeekend &&
      (!dayData.notes || dayData.notes.trim() === '');
    
    if (isEmpty) {
      delete currentRecords[day];
    } else {
      currentRecords[day] = {
        isGuardia: !!dayData.isGuardia,
        isGuardiaCompleta: !!dayData.isGuardiaCompleta,
        isSpecialPay: !!dayData.isSpecialPay,
        specialPayAmount: dayData.specialPayAmount !== undefined && dayData.specialPayAmount !== null && dayData.specialPayAmount !== ''
          ? Math.max(0, parseFloat(dayData.specialPayAmount) || 0)
          : undefined,
        overtimeHours: Math.max(0, parseInt(dayData.overtimeHours, 10) || 0),
        isWeekend: !!dayData.isWeekend,
        notes: (dayData.notes || '').trim(),
        updatedAt: new Date().toISOString(),
      };
    }

    const key = getMonthKey(year, month);
    await AsyncStorage.setItem(key, JSON.stringify(currentRecords));
    return currentRecords;
  } catch (e) {
    console.error('Error al guardar registro del día:', e);
    return null;
  }
}

/**
 * Guardar o actualizar múltiples días a la vez
 * patchData puede contener:
 * - guardType: 'regular' | 'completa' | 'especial' | 'none'
 * - specialPayAmount: number
 * - isWeekend: bool
 * - overtimeHours: number
 * - mode: 'set' | 'clear'
 */
export async function saveMultipleDaysRecords(year, month, daysArray, patchData) {
  try {
    const currentRecords = await getMonthRecords(year, month);

    daysArray.forEach((day) => {
      const existing = currentRecords[day] || {
        isGuardia: false,
        isGuardiaCompleta: false,
        isSpecialPay: false,
        specialPayAmount: undefined,
        overtimeHours: 0,
        isWeekend: false,
        notes: '',
      };

      if (patchData.mode === 'clear') {
        delete currentRecords[day];
        return;
      }

      // Aplicar tipo de guardia si se especificó
      if (patchData.guardType) {
        if (patchData.guardType === 'regular') {
          existing.isGuardia = true;
          existing.isGuardiaCompleta = false;
          existing.isSpecialPay = false;
        } else if (patchData.guardType === 'completa') {
          existing.isGuardia = false;
          existing.isGuardiaCompleta = true;
          existing.isSpecialPay = false;
        } else if (patchData.guardType === 'especial') {
          existing.isGuardia = false;
          existing.isGuardiaCompleta = false;
          existing.isSpecialPay = true;
          if (patchData.specialPayAmount !== undefined) {
            existing.specialPayAmount = Math.max(0, parseFloat(patchData.specialPayAmount) || 0);
          }
        } else if (patchData.guardType === 'none') {
          existing.isGuardia = false;
          existing.isGuardiaCompleta = false;
          existing.isSpecialPay = false;
          existing.specialPayAmount = undefined;
        }
      }

      // Fin de semana opcional (solo se activa si el día cae efectivamente en sábado o domingo)
      if (patchData.isWeekend !== undefined) {
        const isCalWk = isWeekendDay(year, month, day);
        existing.isWeekend = isCalWk ? !!patchData.isWeekend : false;
      }

      // Horas extras opcional
      if (patchData.overtimeHours !== undefined) {
        existing.overtimeHours = Math.max(0, parseInt(patchData.overtimeHours, 10) || 0);
      }

      existing.updatedAt = new Date().toISOString();

      // Verificar si quedó vacío
      const isEmpty =
        !existing.isGuardia &&
        !existing.isGuardiaCompleta &&
        !existing.isSpecialPay &&
        (!existing.overtimeHours || existing.overtimeHours <= 0) &&
        !existing.isWeekend &&
        (!existing.notes || existing.notes.trim() === '');

      if (isEmpty) {
        delete currentRecords[day];
      } else {
        currentRecords[day] = existing;
      }
    });

    const key = getMonthKey(year, month);
    await AsyncStorage.setItem(key, JSON.stringify(currentRecords));
    return currentRecords;
  } catch (e) {
    console.error('Error al guardar múltiples días:', e);
    return null;
  }
}

/**
 * Limpiar todos los registros de un mes
 */
export async function clearMonthRecords(year, month) {
  try {
    const key = getMonthKey(year, month);
    await AsyncStorage.removeItem(key);
    return true;
  } catch (e) {
    console.error('Error al limpiar mes:', e);
    return false;
  }
}
