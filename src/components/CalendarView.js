import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  MONTH_NAMES,
  getDaysInMonth,
  isWeekendDay,
} from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Días de la semana en formato claro
const WEEKDAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

export default function CalendarView({
  year,
  month,
  records,
  settings,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onQuickApplyBrush,
  onBatchApply,
  onClearMonth,
}) {
  // Pincel activo seleccionado:
  // 'guardia' | 'guardiaCompleta' | 'weekend' | 'overtime' | 'eraser'
  const [activeBrush, setActiveBrush] = useState('guardia');

  const totalDays = getDaysInMonth(year, month);
  const firstDayDate = new Date(year, month, 1);
  const firstDayOfWeek = (firstDayDate.getDay() + 6) % 7; // Convertir para que 0 sea Lunes

  // Celdas del calendario
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }

  for (let d = 1; d <= totalDays; d++) {
    const rec = records[d] || null;
    const isWk = isWeekendDay(year, month, d);
    const hasActivity =
      rec &&
      (rec.isGuardia ||
        rec.isGuardiaCompleta ||
        rec.isSpecialPay ||
        rec.overtimeHours > 0 ||
        (rec.isWeekend && isWk));

    cells.push({
      type: 'day',
      day: d,
      key: `day-${d}`,
      isWeekend: isWk,
      record: rec,
      hasActivity,
    });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = isCurrentMonth ? today.getDate() : -1;

  // Tocar un día aplica el pincel seleccionado directamente
  const handleDayPress = (day) => {
    try {
      Vibration.vibrate(25);
    } catch (e) {}

    if (onQuickApplyBrush) {
      onQuickApplyBrush(day, activeBrush);
    }
  };

  // Mantener presionado abre el detalle (para notas o tarifa personalizada)
  const handleDayLongPress = (day) => {
    try {
      Vibration.vibrate(40);
    } catch (e) {}
    onSelectDay(day);
  };

  // Atajo: Fines de semana
  const handleBatchWeekends = () => {
    try { Vibration.vibrate(30); } catch (e) {}
    const weekends = [];
    for (let d = 1; d <= totalDays; d++) {
      if (isWeekendDay(year, month, d)) weekends.push(d);
    }
    const allMarked = weekends.every((d) => records[d] && records[d].isWeekend);
    if (onBatchApply) {
      onBatchApply(weekends, { isWeekend: !allMarked });
    }
  };

  // Atajo: Lunes a Viernes
  const handleBatchWorkDays = () => {
    try { Vibration.vibrate(30); } catch (e) {}
    const refDate = isCurrentMonth ? today : new Date(year, month, 1);
    const dayOfWeek = (refDate.getDay() + 6) % 7;
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - dayOfWeek);

    const workDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      if (d.getFullYear() === year && d.getMonth() === month) {
        workDays.push(d.getDate());
      }
    }

    if (workDays.length === 0) {
      for (let d = 1; d <= totalDays; d++) {
        if (!isWeekendDay(year, month, d)) {
          workDays.push(d);
          if (workDays.length === 5) break;
        }
      }
    }

    if (onBatchApply && workDays.length > 0) {
      onBatchApply(workDays, { isGuardia: true });
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Selector de Mes */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.arrowBtn} onPress={onPrevMonth} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={26} color="#FFFFFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>
          {MONTH_NAMES[month]} {year}
        </Text>

        <TouchableOpacity style={styles.arrowBtn} onPress={onNextMonth} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-right" size={26} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* 2. Atajos rápidos esenciales (Solo 2 botones grandes y claros) */}
      <View style={styles.presetRow}>
        <TouchableOpacity
          style={[styles.presetBtn, styles.presetWeekend]}
          onPress={handleBatchWeekends}
          activeOpacity={0.7}
        >
          <Text style={styles.presetEmoji}>🏖️</Text>
          <Text style={[styles.presetText, { color: '#F472B6' }]}>Fines de semana</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.presetBtn, styles.presetWorkweek]}
          onPress={handleBatchWorkDays}
          activeOpacity={0.7}
        >
          <Text style={styles.presetEmoji}>💼</Text>
          <Text style={[styles.presetText, { color: '#818CF8' }]}>Lunes a Viernes</Text>
        </TouchableOpacity>
      </View>

      {/* 3. Días de la semana */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((w, idx) => (
          <View key={idx} style={styles.weekdayCell}>
            <Text style={[styles.weekdayText, (idx === 5 || idx === 6) && styles.weekendHeader]}>
              {w}
            </Text>
          </View>
        ))}
      </View>

      {/* 4. Grid de Días */}
      <View style={styles.grid}>
        {cells.map((cell) => {
          if (cell.type === 'empty') {
            return <View key={cell.key} style={styles.emptyCell} />;
          }

          const rec = cell.record;
          const hasGuardia = rec && rec.isGuardia;
          const hasFullGuardia = rec && rec.isGuardiaCompleta;
          const hasSpecial = rec && rec.isSpecialPay;
          const hasOvertime = rec && rec.overtimeHours > 0;
          const hasWeekendMark = rec && rec.isWeekend && cell.isWeekend;
          const isToday = cell.day === currentDay;

          // Color de fondo y borde según la actividad principal
          let cellStyle = styles.dayCellDefault;
          if (hasFullGuardia) cellStyle = styles.dayCellFullGuard;
          else if (hasGuardia) cellStyle = styles.dayCellGuard;
          else if (hasSpecial) cellStyle = styles.dayCellSpecial;
          else if (hasWeekendMark) cellStyle = styles.dayCellWeekendMark;
          else if (cell.isWeekend) cellStyle = styles.dayCellWeekend;

          return (
            <TouchableOpacity
              key={cell.key}
              style={[
                styles.dayCell,
                cellStyle,
                isToday && styles.dayCellToday,
              ]}
              onPress={() => handleDayPress(cell.day)}
              onLongPress={() => handleDayLongPress(cell.day)}
              activeOpacity={0.6}
              delayPressIn={0}
              delayLongPress={220}
            >
              <Text style={[styles.dayNumber, cell.hasActivity && styles.dayNumberActive]}>
                {cell.day}
              </Text>

              {/* Insignia visual grande y clara */}
              <View style={styles.badgeBox}>
                {hasFullGuardia ? (
                  <Text style={styles.iconBadgeText}>⭐</Text>
                ) : hasGuardia ? (
                  <Text style={styles.iconBadgeText}>🛡️</Text>
                ) : hasSpecial ? (
                  <Text style={styles.iconBadgeText}>✨</Text>
                ) : hasWeekendMark ? (
                  <Text style={styles.iconBadgeText}>🏖️</Text>
                ) : null}

                {hasOvertime && (
                  <Text style={styles.overtimeText}>+{rec.overtimeHours}h</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5. Barra de Herramientas (Grandes, amigables e intuitivas) */}
      <View style={styles.paletteContainer}>
        <Text style={styles.paletteTitle}>ELIGE QUÉ QUIERES MARCAR (Y TOCA LOS DÍAS):</Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.paletteScroll}
        >
          {/* 1. Guardia Regular */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'guardia' && styles.brushBtnActiveGuardia,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('guardia');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>🛡️</Text>
            <Text style={[styles.brushLabel, activeBrush === 'guardia' && styles.brushLabelActive]}>
              {settings?.guardDutyName || 'Regular'}
            </Text>
          </TouchableOpacity>

          {/* 2. Guardia Completa */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'guardiaCompleta' && styles.brushBtnActiveCompleta,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('guardiaCompleta');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>⭐</Text>
            <Text style={[styles.brushLabel, activeBrush === 'guardiaCompleta' && styles.brushLabelActive]}>
              {settings?.fullGuardDutyName || 'Completa'}
            </Text>
          </TouchableOpacity>

          {/* 3. Guardia Especial */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'special' && styles.brushBtnActiveSpecial,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('special');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>✨</Text>
            <Text style={[styles.brushLabel, activeBrush === 'special' && styles.brushLabelActive]}>
              {settings?.specialPayName || 'Especial'}
            </Text>
          </TouchableOpacity>

          {/* 4. Fin de Semana */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'weekend' && styles.brushBtnActiveWeekend,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('weekend');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>🏖️</Text>
            <Text style={[styles.brushLabel, activeBrush === 'weekend' && styles.brushLabelActive]}>
              {settings?.weekendName || 'Finde'}
            </Text>
          </TouchableOpacity>

          {/* 4. Horas Extras */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'overtime' && styles.brushBtnActiveOvertime,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('overtime');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>⏱️</Text>
            <Text style={[styles.brushLabel, activeBrush === 'overtime' && styles.brushLabelActive]}>
              +1h Extra
            </Text>
          </TouchableOpacity>

          {/* 5. Borrar */}
          <TouchableOpacity
            style={[
              styles.brushBtn,
              activeBrush === 'eraser' && styles.brushBtnActiveEraser,
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('eraser');
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.brushEmoji}>🧹</Text>
            <Text style={[styles.brushLabel, activeBrush === 'eraser' && styles.brushLabelActive]}>
              Borrar
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  arrowBtn: {
    padding: 6,
    backgroundColor: '#1E293B',
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  presetRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  presetBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 6,
  },
  presetWeekend: {
    backgroundColor: 'rgba(244, 114, 182, 0.08)',
    borderColor: 'rgba(244, 114, 182, 0.25)',
  },
  presetWorkweek: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  presetEmoji: {
    fontSize: 14,
  },
  presetText: {
    fontSize: 12,
    fontWeight: '800',
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingBottom: 6,
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#64748B',
  },
  weekendHeader: {
    color: '#F472B6',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: '14.28%',
    height: 52,
  },
  dayCell: {
    width: '14.28%',
    height: 52,
    padding: 3,
    borderWidth: 1,
    borderRadius: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayCellDefault: {
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    borderColor: 'rgba(51, 65, 85, 0.5)',
  },
  dayCellWeekend: {
    backgroundColor: 'rgba(244, 114, 182, 0.04)',
    borderColor: 'rgba(244, 114, 182, 0.15)',
  },
  dayCellGuard: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  dayCellFullGuard: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  dayCellSpecial: {
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderColor: '#FB923C',
  },
  dayCellWeekendMark: {
    backgroundColor: 'rgba(244, 114, 182, 0.18)',
    borderColor: '#F472B6',
  },
  dayCellToday: {
    borderColor: '#6366F1',
    borderWidth: 2,
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  dayNumberActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  badgeBox: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: 14,
    lineHeight: 16,
  },
  overtimeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FBBF24',
  },
  paletteContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  paletteTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  paletteScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  brushBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    gap: 6,
  },
  brushBtnActiveGuardia: {
    backgroundColor: 'rgba(56, 189, 248, 0.18)',
    borderColor: '#38BDF8',
  },
  brushBtnActiveCompleta: {
    backgroundColor: 'rgba(168, 85, 247, 0.18)',
    borderColor: '#A855F7',
  },
  brushBtnActiveSpecial: {
    backgroundColor: 'rgba(251, 146, 60, 0.18)',
    borderColor: '#FB923C',
  },
  brushBtnActiveWeekend: {
    backgroundColor: 'rgba(244, 114, 182, 0.18)',
    borderColor: '#F472B6',
  },
  brushBtnActiveOvertime: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
    borderColor: '#FBBF24',
  },
  brushBtnActiveEraser: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    borderColor: '#EF4444',
  },
  brushEmoji: {
    fontSize: 16,
  },
  brushLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  brushLabelActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
});
