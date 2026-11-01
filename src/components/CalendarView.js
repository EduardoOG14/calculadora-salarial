import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Vibration } from 'react-native';
import { COLORS } from '../constants/theme';
import { MONTH_NAMES, getDaysInMonth, isWeekendDay } from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// Días de la semana empezando en Lunes
const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function CalendarView({
  year,
  month,
  records,
  settings,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
  onOpenMultiSelectModal,
}) {
  const [isMultiMode, setIsMultiMode] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectionMethod, setSelectionMethod] = useState('free'); // 'free' | 'range'
  const [rangeStart, setRangeStart] = useState(null);
  const [lastAnchorDay, setLastAnchorDay] = useState(null);

  const totalDays = getDaysInMonth(year, month);
  
  // Primer día del mes (0 = Domingo, 1 = Lunes, etc.)
  const firstDayDate = new Date(year, month, 1);
  const firstDayOfWeek = (firstDayDate.getDay() + 6) % 7; // Convertir para que 0 sea Lunes

  // Construir las celdas del mes
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }

  for (let d = 1; d <= totalDays; d++) {
    cells.push({
      type: 'day',
      day: d,
      key: `day-${d}`,
      isWeekend: isWeekendDay(year, month, d),
      record: records[d] || null,
    });
  }

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const currentDay = isCurrentMonth ? today.getDate() : -1;

  // Lógica de Selección Rápida por Lotes (Presets)
  const handleSelectAllWeekends = () => {
    setIsMultiMode(true);
    setRangeStart(null);
    const weekends = [];
    for (let d = 1; d <= totalDays; d++) {
      if (isWeekendDay(year, month, d)) weekends.push(d);
    }
    // Si ya todos los fines de semana están seleccionados, deseleccionarlos
    const allWkSelected = weekends.every((d) => selectedDays.includes(d));
    if (allWkSelected) {
      setSelectedDays(selectedDays.filter((d) => !weekends.includes(d)));
    } else {
      const merged = Array.from(new Set([...selectedDays, ...weekends])).sort((a, b) => a - b);
      setSelectedDays(merged);
    }
  };

  // Selección de Semana Actual (Lunes a Viernes, sin fines de semana)
  const handleSelectCurrentWeek = () => {
    setIsMultiMode(true);
    setRangeStart(null);

    // Fecha de referencia: hoy si es el mes actual, o el día 1 si navegó a otro mes
    const refDate = isCurrentMonth ? today : new Date(year, month, 1);
    const dayOfWeek = (refDate.getDay() + 6) % 7; // 0 = Lun, 1 = Mar, ..., 6 = Dom
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - dayOfWeek);

    const weekWorkDays = [];
    // Recorrer 5 días: Lunes a Viernes
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      if (d.getFullYear() === year && d.getMonth() === month) {
        weekWorkDays.push(d.getDate());
      }
    }

    // Si la semana de referencia no contiene días de este mes, tomar los primeros días laborables del mes
    if (weekWorkDays.length === 0) {
      for (let d = 1; d <= totalDays; d++) {
        if (!isWeekendDay(year, month, d)) {
          weekWorkDays.push(d);
          if (weekWorkDays.length === 5) break;
        }
      }
    }

    // Toggle: Si ya estaban todos los días de lunes a viernes seleccionados, deseleccionar
    const allSelected = weekWorkDays.length > 0 && weekWorkDays.every((d) => selectedDays.includes(d));
    if (allSelected) {
      setSelectedDays(selectedDays.filter((d) => !weekWorkDays.includes(d)));
      setLastAnchorDay(null);
    } else {
      const merged = Array.from(new Set([...selectedDays, ...weekWorkDays])).sort((a, b) => a - b);
      setSelectedDays(merged);
      if (weekWorkDays.length > 0) {
        setLastAnchorDay(weekWorkDays[weekWorkDays.length - 1]);
      }
    }
  };

  const handleSelectAllMonth = () => {
    setIsMultiMode(true);
    setRangeStart(null);
    if (selectedDays.length === totalDays) {
      setSelectedDays([]);
      setLastAnchorDay(null);
    } else {
      const all = [];
      for (let d = 1; d <= totalDays; d++) all.push(d);
      setSelectedDays(all);
      setLastAnchorDay(totalDays);
    }
  };

  // Manejo de toques en cada día (Tap rápido)
  const handleDayPress = (day) => {
    if (!isMultiMode) {
      onSelectDay(day);
      return;
    }

    // Modo Rango (Inicio -> Fin)
    if (selectionMethod === 'range') {
      if (rangeStart === null) {
        setRangeStart(day);
        setSelectedDays([day]);
        setLastAnchorDay(day);
      } else {
        const start = Math.min(rangeStart, day);
        const end = Math.max(rangeStart, day);
        const range = [];
        for (let i = start; i <= end; i++) range.push(i);
        setSelectedDays(range);
        setRangeStart(null);
        setLastAnchorDay(day);
      }
      return;
    }

    // Modo Libre (Toque directo individual)
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
      setLastAnchorDay(day);
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
      setLastAnchorDay(day);
    }
  };

  // Manejo de dejar presionado el día (Long Press con feedback háptico)
  const handleDayLongPress = (day) => {
    try {
      Vibration.vibrate(35);
    } catch (e) {}

    // Si no estábamos en modo selección múltiple, lo activamos y seleccionamos este día
    if (!isMultiMode) {
      setIsMultiMode(true);
      setSelectedDays([day]);
      setLastAnchorDay(day);
      return;
    }

    // Si ya estamos en selección múltiple y no había días seleccionados
    if (selectedDays.length === 0) {
      setSelectedDays([day]);
      setLastAnchorDay(day);
      return;
    }

    // Si ya hay días seleccionados, "dejar presionado" abarca el bloque entre el ancla y este día
    const anchor = lastAnchorDay !== null ? lastAnchorDay : selectedDays[selectedDays.length - 1];
    const start = Math.min(anchor, day);
    const end = Math.max(anchor, day);
    const range = [];
    for (let i = start; i <= end; i++) range.push(i);

    // Si todos los días de este tramo ya estaban seleccionados, deseleccionamos ese tramo
    const allSelected = range.length > 1 && range.every((d) => selectedDays.includes(d));
    if (allSelected) {
      const remaining = selectedDays.filter((d) => !range.includes(d));
      setSelectedDays(remaining);
      setLastAnchorDay(remaining.length > 0 ? remaining[remaining.length - 1] : null);
    } else {
      // Unir los días abarcados a la selección actual
      const merged = Array.from(new Set([...selectedDays, ...range])).sort((a, b) => a - b);
      setSelectedDays(merged);
      setLastAnchorDay(day);
    }
  };

  const clearSelection = () => {
    setSelectedDays([]);
    setRangeStart(null);
    setLastAnchorDay(null);
  };

  const exitMultiMode = () => {
    setIsMultiMode(false);
    setSelectedDays([]);
    setRangeStart(null);
    setLastAnchorDay(null);
    setSelectionMethod('free');
  };

  const handleOpenAssignModal = () => {
    if (selectedDays.length > 0 && onOpenMultiSelectModal) {
      onOpenMultiSelectModal(selectedDays);
    }
  };

  return (
    <View style={styles.container}>
      {/* Barra de navegación de Mes */}
      <View style={styles.navRow}>
        <TouchableOpacity style={styles.navBtn} onPress={onPrevMonth} activeOpacity={0.7} delayPressIn={0}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Text style={styles.periodIndicator}>
            Cortes 1 y 15 • {totalDays} días
          </Text>
        </View>

        <TouchableOpacity style={styles.navBtn} onPress={onNextMonth} activeOpacity={0.7} delayPressIn={0}>
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* Barra rápida de herramientas de lote (Smart Batch Bar) */}
      <View style={styles.smartBarContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.smartBarScroll}>
          <TouchableOpacity
            style={[styles.batchPill, styles.batchPillWeekend]}
            onPress={handleSelectAllWeekends}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="beach" size={14} color={COLORS.weekend} />
            <Text style={[styles.batchPillText, { color: COLORS.weekend }]}>Fines de semana</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.batchPill}
            onPress={handleSelectCurrentWeek}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="calendar-week" size={14} color={COLORS.indigoLight} />
            <Text style={styles.batchPillText}>Semana actual</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.batchPill}
            onPress={handleSelectAllMonth}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.batchPillText}>Todo el mes</Text>
          </TouchableOpacity>

          {!isMultiMode ? (
            <TouchableOpacity
              style={[styles.batchPill, styles.batchPillActive]}
              onPress={() => setIsMultiMode(true)}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <MaterialCommunityIcons name="checkbox-multiple-marked" size={14} color="#0F172A" />
              <Text style={styles.batchPillTextActive}>Multiselección</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.batchPill, styles.batchPillExit]}
              onPress={exitMultiMode}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <MaterialCommunityIcons name="close" size={14} color={COLORS.danger} />
              <Text style={[styles.batchPillText, { color: COLORS.danger }]}>Salir modo</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* Sub-barra informativa en modo multiselección */}
      {isMultiMode && (
        <View style={styles.multiModeBar}>
          <View style={styles.multiHeaderRow}>
            <View style={styles.multiCountBox}>
              <Text style={styles.multiCountNum}>{selectedDays.length}</Text>
              <Text style={styles.multiCountLabel}>día(s) seleccionado(s)</Text>
            </View>

            {/* Alternar método: Toque libre vs Rango */}
            <View style={styles.methodToggleGroup}>
              <TouchableOpacity
                style={[styles.methodBtn, selectionMethod === 'free' && styles.methodBtnActive]}
                onPress={() => { setSelectionMethod('free'); setRangeStart(null); }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={[styles.methodBtnText, selectionMethod === 'free' && styles.methodBtnTextActive]}>
                  Libre
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.methodBtn, selectionMethod === 'range' && styles.methodBtnActive]}
                onPress={() => { setSelectionMethod('range'); setRangeStart(null); }}
                activeOpacity={0.7}
                delayPressIn={0}
              >
                <Text style={[styles.methodBtnText, selectionMethod === 'range' && styles.methodBtnTextActive]}>
                  Rango A→B
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Guía en modo multiselección */}
          <View style={styles.rangeHintBox}>
            <MaterialCommunityIcons
              name={selectionMethod === 'range' ? 'gesture-tap' : 'gesture-tap-hold'}
              size={14}
              color={COLORS.primaryLight}
            />
            <Text style={styles.rangeHintText}>
              {selectionMethod === 'range'
                ? (rangeStart === null
                    ? 'Toca el día de inicio'
                    : `Inicio en día ${rangeStart}. Toca el día final para abarcar todo el tramo.`)
                : 'Toca días o mantén presionado un día para abarcar un tramo continuo.'}
            </Text>
          </View>
        </View>
      )}

      {/* Cabecera de días de la semana */}
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((wd, idx) => (
          <View key={wd} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                (idx === 5 || idx === 6) && styles.weekendTextHeader,
              ]}
            >
              {wd}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid de días */}
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
          const hasActivity = hasGuardia || hasFullGuardia || hasSpecial || hasOvertime || hasWeekendMark;
          const isToday = cell.day === currentDay;
          const isSelected = isMultiMode && selectedDays.includes(cell.day);
          const isRangeStart = isMultiMode && selectionMethod === 'range' && rangeStart === cell.day;

          return (
            <TouchableOpacity
              key={cell.key}
              style={[
                styles.dayCell,
                cell.isWeekend && styles.dayCellWeekend,
                isToday && styles.dayCellToday,
                hasActivity && styles.dayCellActive,
                isSelected && styles.dayCellSelected,
                isRangeStart && styles.dayCellRangeStart,
              ]}
              onPress={() => handleDayPress(cell.day)}
              onLongPress={() => handleDayLongPress(cell.day)}
              activeOpacity={0.6}
              delayPressIn={0}
              delayLongPress={220}
            >
              {/* Número del día y marca de selección */}
              <View style={styles.dayHeader}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    hasActivity && styles.dayNumberActive,
                    isSelected && styles.dayNumberSelected,
                  ]}
                >
                  {cell.day}
                </Text>
                {isSelected ? (
                  <View style={styles.selectedCheckBadge}>
                    <MaterialCommunityIcons name="check" size={10} color="#0F172A" />
                  </View>
                ) : isToday ? (
                  <View style={styles.todayDot} />
                ) : null}
              </View>

              {/* Badges de actividades */}
              <View style={styles.badgesContainer}>
                {hasGuardia && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.guardiaBg }]}>
                    <MaterialCommunityIcons name="shield" size={10} color={COLORS.guardia} />
                    <Text style={[styles.miniBadgeText, { color: COLORS.guardia }]}>G</Text>
                  </View>
                )}

                {hasFullGuardia && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                    <MaterialCommunityIcons name="shield-star" size={10} color={COLORS.guardiaCompleta} />
                    <Text style={[styles.miniBadgeText, { color: COLORS.guardiaCompleta }]}>GC</Text>
                  </View>
                )}

                {hasSpecial && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.specialBg }]}>
                    <MaterialCommunityIcons name="star" size={10} color={COLORS.special} />
                    <Text style={[styles.miniBadgeText, { color: COLORS.special }]}>GE</Text>
                  </View>
                )}

                {hasOvertime && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.overtimeBg }]}>
                    <MaterialCommunityIcons name="clock-outline" size={10} color={COLORS.overtime} />
                    <Text style={[styles.miniBadgeText, { color: COLORS.overtime }]}>
                      {rec.overtimeHours}h
                    </Text>
                  </View>
                )}

                {hasWeekendMark && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.weekendBg }]}>
                    <MaterialCommunityIcons name="beach" size={10} color={COLORS.weekend} />
                    <Text style={[styles.miniBadgeText, { color: COLORS.weekend }]}>F</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Barra de acción flotante e intuitiva cuando hay días seleccionados */}
      {isMultiMode && selectedDays.length > 0 && (
        <View style={styles.bottomFloatingActionBar}>
          <View style={styles.floatingLeft}>
            <View style={styles.countBadgeRound}>
              <Text style={styles.floatingCountText}>{selectedDays.length}</Text>
            </View>
            <View>
              <Text style={styles.floatingTitleText}>Días marcados</Text>
              <TouchableOpacity onPress={clearSelection} delayPressIn={0}>
                <Text style={styles.floatingClearText}>Limpiar selección</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.floatingActionBtn}
            onPress={handleOpenAssignModal}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="lightning-bolt" size={18} color="#0F172A" />
            <Text style={styles.floatingActionBtnText}>Configurar Lote</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Leyenda */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.guardia }]} />
          <Text style={styles.legendText} numberOfLines={1}>{settings?.guardDutyName || 'Guardia'}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.guardiaCompleta }]} />
          <Text style={styles.legendText} numberOfLines={1}>{settings?.fullGuardDutyName || 'G. Compl.'}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.special }]} />
          <Text style={styles.legendText} numberOfLines={1}>{settings?.specialPayName || 'G. Especial'}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.overtime }]} />
          <Text style={styles.legendText} numberOfLines={1}>{settings?.overtimeName || 'Horas Extras'}</Text>
        </View>

        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: COLORS.weekend }]} />
          <Text style={styles.legendText} numberOfLines={1}>{settings?.weekendName || 'Fin de Sem.'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  navBtn: {
    padding: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
  },
  periodIndicator: {
    fontSize: 11,
    color: COLORS.indigoLight,
    marginTop: 2,
    fontWeight: '500',
  },
  smartBarContainer: {
    marginBottom: 8,
  },
  smartBarScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  batchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  batchPillWeekend: {
    borderColor: 'rgba(244, 114, 182, 0.4)',
    backgroundColor: 'rgba(244, 114, 182, 0.08)',
  },
  batchPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryDark,
  },
  batchPillExit: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  batchPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  batchPillTextActive: {
    fontSize: 12,
    fontWeight: '900',
    color: '#0F172A',
  },
  multiModeBar: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
  },
  multiHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  multiCountBox: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  multiCountNum: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  multiCountLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  methodToggleGroup: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  methodBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  methodBtnActive: {
    backgroundColor: COLORS.primary,
  },
  methodBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  methodBtnTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  rangeHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(16, 185, 129, 0.15)',
  },
  rangeHintText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '600',
  },
  weekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 6,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  weekendTextHeader: {
    color: COLORS.weekend,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  emptyCell: {
    width: '14.28%',
    height: 58,
  },
  dayCell: {
    width: '14.28%',
    height: 58,
    padding: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(51, 65, 85, 0.4)',
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.4)',
    justifyContent: 'space-between',
  },
  dayCellWeekend: {
    backgroundColor: 'rgba(244, 114, 182, 0.05)',
  },
  dayCellToday: {
    borderColor: COLORS.indigo,
    borderWidth: 1.5,
  },
  dayCellActive: {
    borderColor: COLORS.primary,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  dayCellSelected: {
    borderColor: COLORS.primaryLight,
    borderWidth: 2,
    backgroundColor: 'rgba(16, 185, 129, 0.28)',
  },
  dayCellRangeStart: {
    borderColor: COLORS.overtime,
    borderWidth: 2,
    backgroundColor: 'rgba(251, 191, 36, 0.25)',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayNumberToday: {
    color: COLORS.indigoLight,
  },
  dayNumberActive: {
    color: COLORS.primaryLight,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  selectedCheckBadge: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todayDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.indigo,
  },
  badgesContainer: {
    flexDirection: 'column',
    gap: 2,
    overflow: 'hidden',
  },
  miniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 2,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  miniBadgeText: {
    fontSize: 8,
    fontWeight: '800',
  },
  bottomFloatingActionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 12,
    marginBottom: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  floatingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countBadgeRound: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCountText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  floatingTitleText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.text,
  },
  floatingClearText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginTop: 1,
  },
  floatingActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  floatingActionBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
    flexWrap: 'wrap',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
});
