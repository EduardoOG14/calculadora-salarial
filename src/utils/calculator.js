/**
 * Utilidades de cálculo salarial y fechas
 */

export const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DAY_NAMES = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
export const FULL_DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

/**
 * Obtiene el número total de días en un mes dado (base 0)
 */
export function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Comprueba si una fecha cae en sábado o domingo
 */
export function isWeekendDay(year, month, day) {
  const d = new Date(year, month, day);
  const dayOfWeek = d.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Domingo, 6 = Sábado
}

/**
 * Formatea un monto a dólares con separador de miles y dos decimales: $1,250.00
 */
export function formatUSD(amount) {
  const num = Number(amount) || 0;
  return '$' + num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Formatea un monto a Bolívares (VES) con formato estándar: Bs. 1.250,50
 */
export function formatVES(amount) {
  const num = Number(amount) || 0;
  return 'Bs. ' + num.toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Realiza el cálculo salarial con cortes del día 1 y día 15
 * - Día 1: % de salario base asignado + 100% de extras (guardias, horas extras, fines de semana, guardias especiales)
 * - Día 15: Restante del salario base (100% - %)
 */
export function calculateSalary(settings, records, year, month) {
  const baseSalary = Number(settings.baseSalary) || 0;
  
  // Porcentaje del salario base a pagar el día 1 (permite decimales, ej. 50.5%)
  const firstCutPercentRaw = parseFloat(String(settings.firstCutPercent !== undefined ? settings.firstCutPercent : 50).replace(',', '.'));
  const firstCutPercent = Math.min(100, Math.max(0, isNaN(firstCutPercentRaw) ? 50 : parseFloat(firstCutPercentRaw.toFixed(2))));
  const secondCutPercent = parseFloat((100 - firstCutPercent).toFixed(2));

  // División del salario base
  const baseSalaryFirstCut = (baseSalary * firstCutPercent) / 100;
  const baseSalarySecondCut = (baseSalary * secondCutPercent) / 100;

  const totalDays = getDaysInMonth(year, month);

  let totalOvertimeHours = 0;
  let totalGuardDays = 0;
  let totalFullGuardDays = 0;
  let totalWeekendDays = 0;
  let totalSpecialDays = 0;

  const dailyBreakdown = [];

  // Iterar sobre todos los días del mes
  for (let day = 1; day <= totalDays; day++) {
    const rec = records[day];
    if (!rec) continue;

    const hasGuardia = !!rec.isGuardia;
    const hasFullGuardia = !!rec.isGuardiaCompleta;
    const hasSpecial = !!rec.isSpecialPay;
    const hours = Number(rec.overtimeHours) || 0;
    const hasWeekend = !!rec.isWeekend && isWeekendDay(year, month, day);

    if (hasGuardia) totalGuardDays += 1;
    if (hasFullGuardia) totalFullGuardDays += 1;
    if (hasSpecial) totalSpecialDays += 1;
    if (hours > 0) totalOvertimeHours += hours;
    if (hasWeekend) totalWeekendDays += 1;

    const dayOvertimePay = hours * (Number(settings.overtimeRate) || 0);
    const dayGuardPay = hasGuardia ? (Number(settings.guardDutyRate) || 0) : 0;
    const dayFullGuardPay = hasFullGuardia ? (Number(settings.fullGuardDutyRate) || 0) : 0;
    const dayWeekendPay = hasWeekend ? (Number(settings.weekendRate) || 0) : 0;
    
    // Tasa específica de guardia especial si el día tiene monto personalizado, o la de configuración
    const specialRateForDay = (rec.specialPayAmount !== undefined && rec.specialPayAmount !== null && !isNaN(Number(rec.specialPayAmount)) && Number(rec.specialPayAmount) >= 0)
      ? Number(rec.specialPayAmount)
      : (Number(settings.specialPayRate) || 0);
    const daySpecialPay = hasSpecial ? specialRateForDay : 0;

    const dayTotal = dayOvertimePay + dayGuardPay + dayFullGuardPay + dayWeekendPay + daySpecialPay;

    if (hasGuardia || hasFullGuardia || hasSpecial || hours > 0 || hasWeekend || (rec.notes && rec.notes.length > 0)) {
      const dateObj = new Date(year, month, day);
      dailyBreakdown.push({
        day,
        dayOfWeek: DAY_NAMES[dateObj.getDay()],
        fullDayOfWeek: FULL_DAY_NAMES[dateObj.getDay()],
        isGuardia: hasGuardia,
        isGuardiaCompleta: hasFullGuardia,
        isSpecialPay: hasSpecial,
        specialPayAmount: specialRateForDay,
        overtimeHours: hours,
        isWeekend: hasWeekend,
        notes: rec.notes || '',
        overtimePay: dayOvertimePay,
        guardPay: dayGuardPay,
        fullGuardPay: dayFullGuardPay,
        weekendPay: dayWeekendPay,
        specialPay: daySpecialPay,
        totalDayExtra: dayTotal,
      });
    }
  }

  const overtimeTotalPay = totalOvertimeHours * (Number(settings.overtimeRate) || 0);
  const guardTotalPay = totalGuardDays * (Number(settings.guardDutyRate) || 0);
  const fullGuardTotalPay = totalFullGuardDays * (Number(settings.fullGuardDutyRate) || 0);
  const weekendTotalPay = totalWeekendDays * (Number(settings.weekendRate) || 0);
  
  // Suma total de guardias especiales calculadas día por día
  const specialTotalPay = dailyBreakdown.reduce((acc, curr) => acc + (curr.specialPay || 0), 0);
  const extrasTotalPay = overtimeTotalPay + guardTotalPay + fullGuardTotalPay + weekendTotalPay + specialTotalPay;

  // CORTE DÍA 1: % de salario base asignado + 100% de todos los extras
  const firstCutTotal = baseSalaryFirstCut + extrasTotalPay;

  // CORTE DÍA 15: Restante del salario base (100% - %)
  const secondCutTotal = baseSalarySecondCut;

  // TOTAL MES: Suma de ambos cortes
  const grandTotal = firstCutTotal + secondCutTotal;

  return {
    period: 'corte_1_15',
    baseSalary,
    firstCutPercent,
    secondCutPercent,
    baseSalaryFirstCut,
    baseSalarySecondCut,
    firstCutTotal,
    secondCutTotal,
    totalOvertimeHours,
    overtimeRate: Number(settings.overtimeRate) || 0,
    overtimeTotalPay,
    totalGuardDays,
    guardRate: Number(settings.guardDutyRate) || 0,
    guardTotalPay,
    totalFullGuardDays,
    fullGuardRate: Number(settings.fullGuardDutyRate) || 0,
    fullGuardTotalPay,
    totalWeekendDays,
    weekendRate: Number(settings.weekendRate) || 0,
    weekendTotalPay,
    totalSpecialDays,
    specialPayRate: Number(settings.specialPayRate) || 0,
    specialTotalPay,
    extrasTotalPay,
    grandTotal,
    dailyBreakdown,
    guardDutyName: settings?.guardDutyName || 'Guardia Regular',
    fullGuardDutyName: settings?.fullGuardDutyName || 'Guardia Completa',
    specialPayName: settings?.specialPayName || 'Guardia Especial',
    overtimeName: settings?.overtimeName || 'Horas Extras',
    weekendName: settings?.weekendName || 'Fin de Semana',
  };
}

/**
 * Genera texto para compartir por WhatsApp u otras apps con detalle exhaustivo día por día
 */
export function generateShareText(calc, settings, year, month, bcvRate = 0) {
  const monthName = MONTH_NAMES[month];
  const periodLabel = `${monthName} ${year}`;
  const totalVES = bcvRate > 0 ? calc.grandTotal * bcvRate : 0;

  const guardName = settings?.guardDutyName || calc?.guardDutyName || 'Guardia Regular';
  const fullGuardName = settings?.fullGuardDutyName || calc?.fullGuardDutyName || 'Guardia Completa';
  const specialName = settings?.specialPayName || calc?.specialPayName || 'Guardia Especial';
  const overtimeName = settings?.overtimeName || calc?.overtimeName || 'Horas Extras';
  const weekendName = settings?.weekendName || calc?.weekendName || 'Fin de Semana';

  let text = `📋 *REPORTE DETALLADO DE SALARIO*\n`;
  text += `📅 *${periodLabel.toUpperCase()}*\n`;
  text += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  text += `🗓️ *DÍAS TRABAJADOS Y CONCEPTOS:*\n\n`;

  if (calc.dailyBreakdown.length === 0) {
    text += `• Sin actividades extras registradas este mes.\n\n`;
  } else {
    calc.dailyBreakdown.forEach((item) => {
      const padDay = String(item.day).padStart(2, '0');
      const padMonth = String(month + 1).padStart(2, '0');
      text += `🔹 *${item.dayOfWeek} ${padDay}/${padMonth}:*\n`;

      const concepts = [];
      if (item.isGuardia) {
        concepts.push(`   • ${guardName}: +${formatUSD(item.guardPay)}`);
      }
      if (item.isGuardiaCompleta) {
        concepts.push(`   • ${fullGuardName}: +${formatUSD(item.fullGuardPay)}`);
      }
      if (item.overtimeHours > 0) {
        concepts.push(`   • ${overtimeName} (${item.overtimeHours}h): +${formatUSD(item.overtimePay)}`);
      }
      if (item.isWeekend) {
        concepts.push(`   • ${weekendName}: +${formatUSD(item.weekendPay)}`);
      }
      if (item.isSpecialPay) {
        concepts.push(`   • ${specialName}: +${formatUSD(item.specialPay)}`);
      }
      if (item.notes && item.notes.trim() !== '') {
        concepts.push(`   • Nota: "${item.notes.trim()}"`);
      }

      text += concepts.join('\n') + '\n';
      text += `   ↳ *Total adicional del día:* +${formatUSD(item.totalDayExtra)}\n\n`;
    });
  }

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `📊 *PAGOS Y CORTES (1 Y 15):*\n\n`;

  text += `🗓️ *PAGO DÍA 1 DEL MES:*\n`;
  text += `   • Base (${calc.firstCutPercent}%): ${formatUSD(calc.baseSalaryFirstCut)}\n`;
  text += `   • Guardias y Extras (100%): +${formatUSD(calc.extrasTotalPay)}\n`;
  text += `   💰 *A COBRAR DÍA 1:* *${formatUSD(calc.firstCutTotal)}*\n`;
  if (bcvRate > 0) {
    text += `   🇻🇪 *Equiv. Bs:* ${formatVES(calc.firstCutTotal * bcvRate)}\n`;
  }
  text += `\n`;

  text += `🗓️ *PAGO DÍA 15 DEL MES:*\n`;
  text += `   • Base restante (${calc.secondCutPercent}%): ${formatUSD(calc.baseSalarySecondCut)}\n`;
  text += `   💰 *A COBRAR DÍA 15:* *${formatUSD(calc.secondCutTotal)}*\n`;
  if (bcvRate > 0) {
    text += `   🇻🇪 *Equiv. Bs:* ${formatVES(calc.secondCutTotal * bcvRate)}\n`;
  }
  text += `\n`;

  text += `━━━━━━━━━━━━━━━━━━━━━\n`;
  text += `💰 *TOTAL GENERAL DEL MES:* ${formatUSD(calc.grandTotal)}\n`;
  if (bcvRate > 0) {
    text += `🇻🇪 *TOTAL MES EN BS:* ${formatVES(totalVES)}\n`;
    text += `🏛️ _Tasa Oficial BCV: ${formatVES(bcvRate)} / USD_\n`;
  }

  return text;
}
