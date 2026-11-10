import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Vibration,
  Alert,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  MONTH_NAMES,
  getDaysInMonth,
  isWeekendDay,
} from '../utils/calculator';
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
  onQuickApplyBrush,
  onBatchApply,
  onClearMonth,
}) {
  // Pincel activo seleccionado:
  // 'guardia' | 'guardiaCompleta' | 'special' | 'weekend' | 'overtime' | 'eraser' | 'inspect'
  const [activeBrush, setActiveBrush] = useState('guardia');

  const totalDays = getDaysInMonth(year, month);

  // Primer día del mes (0 = Domingo, 1 = Lunes, etc.)
  const firstDayDate = new Date(year, month, 1);
  const firstDayOfWeek = (firstDayDate.getDay() + 6) % 7; // Convertir para que 0 sea Lunes

  // Construir las celdas del mes
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push({ type: 'empty', key: `empty-${i}` });
  }

  let daysWithActivityCount = 0;
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
    if (hasActivity) daysWithActivityCount++;

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

  // Manejo de pulsación rápida sobre un día con la modalidad "Don't Make Me Think"
  const handleDayPress = (day) => {
    // Si la herramienta activa es "Detalle / Inspeccionar", abrir modal completo
    if (activeBrush === 'inspect') {
      try {
        Vibration.vibrate(20);
      } catch (e) {}
      onSelectDay(day);
      return;
    }

    // Vibración táctil inmediata al aplicar con el pincel
    try {
      Vibration.vibrate(25);
    } catch (e) {}

    if (onQuickApplyBrush) {
      onQuickApplyBrush(day, activeBrush);
    }
  };

  // Pulsación prolongada: siempre abre el detalle completo con notas y ajustes
  const handleDayLongPress = (day) => {
    try {
      Vibration.vibrate(40);
    } catch (e) {}
    onSelectDay(day);
  };

  // --- ATAJOS RÁPIDOS EN LOTE (Smart Presets) ---

  // 1. Fines de semana: marca todos los sábados y domingos
  const handleBatchWeekends = () => {
    try {
      Vibration.vibrate(30);
    } catch (e) {}
    const weekends = [];
    for (let d = 1; d <= totalDays; d++) {
      if (isWeekendDay(year, month, d)) weekends.push(d);
    }

    // Comprobar si ya todos los fines de semana tienen marca de fin de semana
    const allMarked = weekends.every((d) => records[d] && records[d].isWeekend);

    if (onBatchApply) {
      onBatchApply(weekends, { isWeekend: !allMarked });
    }
  };

  // 2. Semana actual (Lunes a Viernes)
  const handleBatchCurrentWeek = () => {
    try {
      Vibration.vibrate(30);
    } catch (e) {}
    const refDate = isCurrentMonth ? today : new Date(year, month, 1);
    const dayOfWeek = (refDate.getDay() + 6) % 7; // 0 = Lun, 1 = Mar, ..., 6 = Dom
    const monday = new Date(refDate.getFullYear(), refDate.getMonth(), refDate.getDate() - dayOfWeek);

    const weekWorkDays = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
      if (d.getFullYear() === year && d.getMonth() === month) {
        weekWorkDays.push(d.getDate());
      }
    }

    if (weekWorkDays.length === 0) {
      for (let d = 1; d <= totalDays; d++) {
        if (!isWeekendDay(year, month, d)) {
          weekWorkDays.push(d);
          if (weekWorkDays.length === 5) break;
        }
      }
    }

    // Aplicar la herramienta activa a los días de la semana
    let patch = {};
    if (activeBrush === 'guardia') patch = { isGuardia: true };
    else if (activeBrush === 'guardiaCompleta') patch = { isGuardiaCompleta: true };
    else if (activeBrush === 'special') patch = { isSpecialPay: true };
    else if (activeBrush === 'eraser') patch = { isGuardia: false, isGuardiaCompleta: false, isSpecialPay: false, overtimeHours: 0, isWeekend: false, notes: '' };
    else patch = { isGuardia: true };

    if (onBatchApply && weekWorkDays.length > 0) {
      onBatchApply(weekWorkDays, patch);
    }
  };

  // 3. Todo el mes con la herramienta activa
  const handleBatchAllMonth = () => {
    Alert.alert(
      'Marcar todo el mes',
      `¿Deseas aplicar "${getBrushLabel(activeBrush)}" a todos los ${totalDays} días de este mes?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, aplicar',
          onPress: () => {
            const allDays = [];
            for (let d = 1; d <= totalDays; d++) allDays.push(d);

            let patch = {};
            if (activeBrush === 'guardia') patch = { isGuardia: true };
            else if (activeBrush === 'guardiaCompleta') patch = { isGuardiaCompleta: true };
            else if (activeBrush === 'special') patch = { isSpecialPay: true };
            else if (activeBrush === 'weekend') patch = { isWeekend: true };
            else if (activeBrush === 'eraser') patch = { isGuardia: false, isGuardiaCompleta: false, isSpecialPay: false, overtimeHours: 0, isWeekend: false, notes: '' };
            else patch = { isGuardia: true };

            if (onBatchApply) onBatchApply(allDays, patch);
          },
        },
      ]
    );
  };

  // 4. Limpiar mes completo
  const handleClearMonthPress = () => {
    if (onClearMonth) {
      Alert.alert(
        'Limpiar mes',
        `¿Deseas borrar todas las guardias y registros de ${MONTH_NAMES[month]} ${year}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Sí, borrar todo',
            style: 'destructive',
            onPress: () => onClearMonth(year, month),
          },
        ]
      );
    }
  };

  const getBrushLabel = (type) => {
    switch (type) {
      case 'guardia':
        return settings?.guardDutyName || 'Guardia Regular';
      case 'guardiaCompleta':
        return settings?.fullGuardDutyName || 'Guardia Completa';
      case 'special':
        return settings?.specialPayName || 'Guardia Especial';
      case 'weekend':
        return settings?.weekendName || 'Fin de Semana';
      case 'overtime':
        return settings?.overtimeName || '+1h Extra';
      case 'eraser':
        return 'Borrar día';
      case 'inspect':
        return 'Detalle / Notas';
      default:
        return 'Guardia';
    }
  };

  const getBrushIcon = (type) => {
    switch (type) {
      case 'guardia':
        return 'shield';
      case 'guardiaCompleta':
        return 'shield-star';
      case 'special':
        return 'star';
      case 'weekend':
        return 'beach';
      case 'overtime':
        return 'clock-plus-outline';
      case 'eraser':
        return 'eraser';
      case 'inspect':
        return 'card-text-outline';
      default:
        return 'checkbox-blank-circle-outline';
    }
  };

  const getBrushColor = (type) => {
    switch (type) {
      case 'guardia':
        return COLORS.guardia;
      case 'guardiaCompleta':
        return COLORS.guardiaCompleta;
      case 'special':
        return COLORS.special;
      case 'weekend':
        return COLORS.weekend;
      case 'overtime':
        return COLORS.overtime;
      case 'eraser':
        return COLORS.danger;
      case 'inspect':
        return COLORS.primaryLight;
      default:
        return COLORS.text;
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Barra de Navegación de Mes */}
      <View style={styles.navRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={onPrevMonth}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <MaterialCommunityIcons name="chevron-left" size={26} color={COLORS.text} />
        </TouchableOpacity>

        <View style={styles.navTitleContainer}>
          <Text style={styles.monthTitle}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <Text style={styles.periodIndicator}>
            {daysWithActivityCount} día(s) con actividad • Cortes 1 y 15
          </Text>
        </View>

        <TouchableOpacity
          style={styles.navBtn}
          onPress={onNextMonth}
          activeOpacity={0.7}
          delayPressIn={0}
        >
          <MaterialCommunityIcons name="chevron-right" size={26} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Atajos rápidos inteligentes (1 solo toque) */}
      <View style={styles.smartPresetsRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.smartPresetsScroll}
        >
          <TouchableOpacity
            style={[styles.presetPill, styles.presetPillWeekend]}
            onPress={handleBatchWeekends}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="beach" size={14} color={COLORS.weekend} />
            <Text style={[styles.presetPillText, { color: COLORS.weekend }]}>
              Fines de semana
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetPill}
            onPress={handleBatchCurrentWeek}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="calendar-week" size={14} color={COLORS.indigoLight} />
            <Text style={styles.presetPillText}>Semana actual (Lun-Vie)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.presetPill}
            onPress={handleBatchAllMonth}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={14} color={COLORS.primaryLight} />
            <Text style={styles.presetPillText}>Todo el mes</Text>
          </TouchableOpacity>

          {daysWithActivityCount > 0 && (
            <TouchableOpacity
              style={[styles.presetPill, styles.presetPillDanger]}
              onPress={handleClearMonthPress}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={14} color={COLORS.danger} />
              <Text style={[styles.presetPillText, { color: COLORS.danger }]}>Limpiar mes</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>

      {/* 3. Indicador dinámico de Pincel Activo */}
      <View style={[styles.brushBanner, { borderColor: getBrushColor(activeBrush) + '55' }]}>
        <View style={styles.brushBannerLeft}>
          <View
            style={[
              styles.brushIndicatorIconBox,
              { backgroundColor: getBrushColor(activeBrush) + '22' },
            ]}
          >
            <MaterialCommunityIcons
              name={getBrushIcon(activeBrush)}
              size={16}
              color={getBrushColor(activeBrush)}
            />
          </View>
          <View>
            <Text style={styles.brushBannerLabel}>
              PINCEL: <Text style={{ color: getBrushColor(activeBrush), fontWeight: '900' }}>{getBrushLabel(activeBrush)}</Text>
            </Text>
            <Text style={styles.brushBannerSub}>
              {activeBrush === 'inspect'
                ? 'Toca un día para ver detalle, o mantén presionado.'
                : activeBrush === 'eraser'
                ? 'Toca cualquier día para borrar sus marcas.'
                : activeBrush === 'overtime'
                ? 'Toca para sumar +1h extra a cada día.'
                : 'Toca días directamente para marcar o desmarcar.'}
            </Text>
          </View>
        </View>
      </View>

      {/* 4. Cabecera de días de la semana */}
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

      {/* 5. Grid de días del calendario */}
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
          const hasNotes = rec && rec.notes && rec.notes.trim().length > 0;
          const isToday = cell.day === currentDay;

          return (
            <TouchableOpacity
              key={cell.key}
              style={[
                styles.dayCell,
                cell.isWeekend && styles.dayCellWeekend,
                isToday && styles.dayCellToday,
                cell.hasActivity && styles.dayCellActive,
              ]}
              onPress={() => handleDayPress(cell.day)}
              onLongPress={() => handleDayLongPress(cell.day)}
              activeOpacity={0.55}
              delayPressIn={0}
              delayLongPress={240}
            >
              {/* Encabezado del día: Número y badges informativos */}
              <View style={styles.dayHeader}>
                <Text
                  style={[
                    styles.dayNumber,
                    isToday && styles.dayNumberToday,
                    cell.hasActivity && styles.dayNumberActive,
                  ]}
                >
                  {cell.day}
                </Text>

                <View style={styles.headerRightIndicators}>
                  {hasNotes && (
                    <View style={styles.noteIndicatorDot} />
                  )}
                  {isToday && <View style={styles.todayDot} />}
                </View>
              </View>

              {/* Insignias de actividades aplicadas */}
              <View style={styles.badgesContainer}>
                {hasGuardia && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.guardiaBg }]}>
                    <Text style={[styles.miniBadgeText, { color: COLORS.guardia }]}>G</Text>
                  </View>
                )}

                {hasFullGuardia && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                    <Text style={[styles.miniBadgeText, { color: COLORS.guardiaCompleta }]}>GC</Text>
                  </View>
                )}

                {hasSpecial && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.specialBg }]}>
                    <Text style={[styles.miniBadgeText, { color: COLORS.special }]}>GE</Text>
                  </View>
                )}

                {hasOvertime && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.overtimeBg }]}>
                    <Text style={[styles.miniBadgeText, { color: COLORS.overtime }]}>
                      +{rec.overtimeHours}h
                    </Text>
                  </View>
                )}

                {hasWeekendMark && (
                  <View style={[styles.miniBadge, { backgroundColor: COLORS.weekendBg }]}>
                    <Text style={[styles.miniBadgeText, { color: COLORS.weekend }]}>F</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 6. Paleta de Pinceles Inferior ("Modo Pincel" - Don't Make Me Think) */}
      <View style={styles.brushPaletteContainer}>
        <View style={styles.paletteHeader}>
          <Text style={styles.paletteTitle}>HERRAMIENTAS DE MARCADO RÁPIDO</Text>
          <Text style={styles.paletteHint}>1 toque aplica al día</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.paletteScroll}
        >
          {/* Herramienta 1: Guardia Regular */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'guardia' && [
                styles.toolBtnActive,
                { borderColor: COLORS.guardia, backgroundColor: COLORS.guardiaBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('guardia');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="shield"
              size={18}
              color={activeBrush === 'guardia' ? COLORS.guardia : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'guardia' && { color: COLORS.guardia, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              {settings?.guardDutyName || 'Regular'}
            </Text>
          </TouchableOpacity>

          {/* Herramienta 2: Guardia Completa */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'guardiaCompleta' && [
                styles.toolBtnActive,
                { borderColor: COLORS.guardiaCompleta, backgroundColor: COLORS.guardiaCompletaBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('guardiaCompleta');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="shield-star"
              size={18}
              color={activeBrush === 'guardiaCompleta' ? COLORS.guardiaCompleta : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'guardiaCompleta' && { color: COLORS.guardiaCompleta, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              {settings?.fullGuardDutyName || 'Completa'}
            </Text>
          </TouchableOpacity>

          {/* Herramienta 3: Guardia Especial */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'special' && [
                styles.toolBtnActive,
                { borderColor: COLORS.special, backgroundColor: COLORS.specialBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('special');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="star"
              size={18}
              color={activeBrush === 'special' ? COLORS.special : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'special' && { color: COLORS.special, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              {settings?.specialPayName || 'Especial'}
            </Text>
          </TouchableOpacity>

          {/* Herramienta 4: Fin de Semana */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'weekend' && [
                styles.toolBtnActive,
                { borderColor: COLORS.weekend, backgroundColor: COLORS.weekendBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('weekend');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="beach"
              size={18}
              color={activeBrush === 'weekend' ? COLORS.weekend : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'weekend' && { color: COLORS.weekend, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              {settings?.weekendName || 'Fin de sem.'}
            </Text>
          </TouchableOpacity>

          {/* Herramienta 5: Horas Extras */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'overtime' && [
                styles.toolBtnActive,
                { borderColor: COLORS.overtime, backgroundColor: COLORS.overtimeBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('overtime');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="clock-plus-outline"
              size={18}
              color={activeBrush === 'overtime' ? COLORS.overtime : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'overtime' && { color: COLORS.overtime, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              +1h Extra
            </Text>
          </TouchableOpacity>

          {/* Herramienta 6: Borrador */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'eraser' && [
                styles.toolBtnActive,
                { borderColor: COLORS.danger, backgroundColor: COLORS.dangerBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('eraser');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="eraser"
              size={18}
              color={activeBrush === 'eraser' ? COLORS.danger : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'eraser' && { color: COLORS.danger, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              Borrar
            </Text>
          </TouchableOpacity>

          {/* Herramienta 7: Detalle / Notas */}
          <TouchableOpacity
            style={[
              styles.toolBtn,
              activeBrush === 'inspect' && [
                styles.toolBtnActive,
                { borderColor: COLORS.primaryLight, backgroundColor: COLORS.primaryBg },
              ],
            ]}
            onPress={() => {
              try { Vibration.vibrate(15); } catch (e) {}
              setActiveBrush('inspect');
            }}
            activeOpacity={0.7}
            delayPressIn={0}
          >
            <MaterialCommunityIcons
              name="card-text-outline"
              size={18}
              color={activeBrush === 'inspect' ? COLORS.primaryLight : COLORS.textSecondary}
            />
            <Text
              style={[
                styles.toolBtnText,
                activeBrush === 'inspect' && { color: COLORS.primaryLight, fontWeight: '900' },
              ]}
              numberOfLines={1}
            >
              Detalle
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    padding: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 12,
  },
  navTitleContainer: {
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.3,
  },
  periodIndicator: {
    fontSize: 11,
    color: COLORS.primaryLight,
    marginTop: 2,
    fontWeight: '600',
  },
  smartPresetsRow: {
    marginBottom: 10,
  },
  smartPresetsScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  presetPill: {
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
  presetPillWeekend: {
    borderColor: 'rgba(244, 114, 182, 0.4)',
    backgroundColor: 'rgba(244, 114, 182, 0.08)',
  },
  presetPillDanger: {
    borderColor: 'rgba(239, 68, 68, 0.4)',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
  },
  presetPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  brushBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 10,
  },
  brushBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  brushIndicatorIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brushBannerLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  brushBannerSub: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 1,
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
    fontWeight: '800',
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
    height: 56,
  },
  dayCell: {
    width: '14.28%',
    height: 56,
    padding: 3,
    borderWidth: 0.5,
    borderColor: 'rgba(51, 65, 85, 0.45)',
    borderRadius: 8,
    backgroundColor: 'rgba(30, 41, 59, 0.35)',
    justifyContent: 'space-between',
  },
  dayCellWeekend: {
    backgroundColor: 'rgba(244, 114, 182, 0.05)',
  },
  dayCellToday: {
    borderColor: COLORS.indigo,
    borderWidth: 1.5,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
  },
  dayCellActive: {
    borderColor: COLORS.primaryLight,
    borderWidth: 1,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
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
    fontWeight: '900',
  },
  dayNumberActive: {
    color: COLORS.primaryLight,
    fontWeight: '900',
  },
  headerRightIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.indigoLight,
  },
  noteIndicatorDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: COLORS.overtime,
  },
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    alignItems: 'flex-end',
  },
  miniBadge: {
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  brushPaletteContainer: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  paletteHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  paletteTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
  },
  paletteHint: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.primaryLight,
  },
  paletteScroll: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  toolBtnActive: {
    borderWidth: 1.5,
  },
  toolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
});
