import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  MONTH_NAMES,
  calculateSalary,
  formatUSD,
  formatVES,
  generateShareText,
} from '../utils/calculator';
import DayModal from '../components/DayModal';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RecordsListScreen({
  settings,
  year,
  month,
  records,
  bcvRate = 0,
  onClearMonth,
  onSaveDay,
  onSelectDay,
}) {
  const [editingDay, setEditingDay] = useState(null);
  const calculation = calculateSalary(settings, records, year, month);
  const items = calculation.dailyBreakdown;

  const handleClear = () => {
    Alert.alert(
      'Limpiar registros del mes',
      `¿Estás seguro de que deseas borrar todas las guardias y horas extras de ${MONTH_NAMES[month]} ${year}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, borrar todo',
          style: 'destructive',
          onPress: () => onClearMonth(year, month),
        },
      ]
    );
  };

  const handleShareWhatsApp = async () => {
    try {
      const text = generateShareText(calculation, settings, year, month, bcvRate);
      await Share.share({
        message: text,
        title: `Resumen de Guardias - ${MONTH_NAMES[month]} ${year}`,
      });
    } catch (e) {
      console.log('Error compartiendo:', e);
    }
  };

  const handleOpenDayModal = (day) => {
    setEditingDay(day);
  };

  const handleCloseDayModal = () => {
    setEditingDay(null);
  };

  const handleSaveDayRecord = (dayData) => {
    if (editingDay && onSaveDay) {
      onSaveDay(year, month, editingDay, dayData);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. Encabezado principal */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Resumen & Compartir</Text>
          <Text style={styles.subtitle}>
            {MONTH_NAMES[month]} {year} • {items.length} día(s) trabajados
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearIconBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Botón principal: Compartir por WhatsApp (Don't Make Me Think) */}
      <TouchableOpacity
        style={styles.whatsAppShareBtn}
        onPress={handleShareWhatsApp}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="whatsapp" size={22} color="#FFFFFF" />
        <View style={styles.whatsAppTextContainer}>
          <Text style={styles.whatsAppBtnTitle}>Compartir Reporte por WhatsApp</Text>
          <Text style={styles.whatsAppBtnSubtitle}>Envía el resumen quincenal y desglose detallado</Text>
        </View>
        <MaterialCommunityIcons name="send" size={18} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 3. Tarjetas compactas de Cortes 1 y 15 */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>DÍA 1 ({calculation.firstCutPercent}%)</Text>
          <Text style={[styles.summaryVal, { color: COLORS.primaryLight }]}>
            {formatUSD(calculation.firstCutTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={styles.summaryValVES}>
              {formatVES(calculation.firstCutTotal * bcvRate)}
            </Text>
          )}
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>DÍA 15 ({calculation.secondCutPercent}%)</Text>
          <Text style={[styles.summaryVal, { color: COLORS.indigoLight }]}>
            {formatUSD(calculation.secondCutTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={styles.summaryValVES}>
              {formatVES(calculation.secondCutTotal * bcvRate)}
            </Text>
          )}
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>TOTAL MES</Text>
          <Text style={[styles.summaryVal, { color: COLORS.text }]}>
            {formatUSD(calculation.grandTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={[styles.summaryValVES, { color: '#34D399' }]}>
              {formatVES(calculation.grandTotal * bcvRate)}
            </Text>
          )}
        </View>
      </View>

      {/* 4. Lista cronológica de días trabajados */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={COLORS.borderLight} />
          <Text style={styles.emptyTitle}>Sin actividades este mes</Text>
          <Text style={styles.emptySub}>
            Toca los días en el Calendario para marcar guardias, horas extras o fines de semana trabajados con 1 toque.
          </Text>
          {onSelectDay && (
            <TouchableOpacity
              style={styles.goToCalendarBtn}
              onPress={() => onSelectDay(1)}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="calendar-month" size={18} color="#0F172A" />
              <Text style={styles.goToCalendarText}>Ir al Calendario</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.day)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.dayRecordCard}
              onPress={() => handleOpenDayModal(item.day)}
              activeOpacity={0.7}
            >
              {/* Columna izquierda: Número del día y Día de la semana */}
              <View style={styles.dayRecordLeft}>
                <View style={styles.dayNumberCircle}>
                  <Text style={styles.dayNumberText}>{item.day}</Text>
                </View>
                <View>
                  <Text style={styles.dayRecordDayName}>{item.fullDayOfWeek}</Text>
                  <Text style={styles.dayRecordPeriod}>
                    {item.day <= 15 ? 'Corte Día 1' : 'Corte Día 15'}
                  </Text>
                </View>
              </View>

              {/* Columna central: Badges de conceptos */}
              <View style={styles.dayRecordCenter}>
                <View style={styles.badgeRow}>
                  {item.isGuardia && (
                    <View style={[styles.badgePill, { backgroundColor: COLORS.guardiaBg }]}>
                      <Text style={[styles.badgePillText, { color: COLORS.guardia }]}>
                        {settings?.guardDutyName || 'Guardia'}
                      </Text>
                    </View>
                  )}

                  {item.isGuardiaCompleta && (
                    <View style={[styles.badgePill, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                      <Text style={[styles.badgePillText, { color: COLORS.guardiaCompleta }]}>
                        {settings?.fullGuardDutyName || 'G. Completa'}
                      </Text>
                    </View>
                  )}

                  {item.isSpecialPay && (
                    <View style={[styles.badgePill, { backgroundColor: COLORS.specialBg }]}>
                      <Text style={[styles.badgePillText, { color: COLORS.special }]}>
                        {settings?.specialPayName || 'Especial'}
                      </Text>
                    </View>
                  )}

                  {item.overtimeHours > 0 && (
                    <View style={[styles.badgePill, { backgroundColor: COLORS.overtimeBg }]}>
                      <Text style={[styles.badgePillText, { color: COLORS.overtime }]}>
                        +{item.overtimeHours}h Extra
                      </Text>
                    </View>
                  )}

                  {item.isWeekend && (
                    <View style={[styles.badgePill, { backgroundColor: COLORS.weekendBg }]}>
                      <Text style={[styles.badgePillText, { color: COLORS.weekend }]}>
                        {settings?.weekendName || 'Fin de sem.'}
                      </Text>
                    </View>
                  )}
                </View>

                {item.notes && item.notes.trim().length > 0 && (
                  <Text style={styles.recordNotesText} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                )}
              </View>

              {/* Columna derecha: Subtotal monetario del día */}
              <View style={styles.dayRecordRight}>
                <Text style={styles.dayRecordAmount}>+{formatUSD(item.totalDayExtra)}</Text>
                {bcvRate > 0 && (
                  <Text style={styles.dayRecordAmountVES}>
                    +{formatVES(item.totalDayExtra * bcvRate)}
                  </Text>
                )}
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.textMuted} style={{ marginTop: 2 }} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal para editar día directamente desde el listado */}
      {editingDay && (
        <DayModal
          visible={!!editingDay}
          day={editingDay}
          month={month}
          year={year}
          initialRecord={records[editingDay] || null}
          settings={settings}
          onClose={handleCloseDayModal}
          onSave={handleSaveDayRecord}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  clearIconBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  whatsAppShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    gap: 12,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  whatsAppTextContainer: {
    flex: 1,
  },
  whatsAppBtnTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  whatsAppBtnSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 1,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: COLORS.border,
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textMuted,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  summaryValVES: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 8,
  },
  dayRecordCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  dayRecordLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: 110,
  },
  dayNumberCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayNumberText: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  dayRecordDayName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  dayRecordPeriod: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  dayRecordCenter: {
    flex: 1,
    paddingHorizontal: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  recordNotesText: {
    fontSize: 10,
    color: COLORS.overtime,
    marginTop: 4,
    fontStyle: 'italic',
  },
  dayRecordRight: {
    alignItems: 'flex-end',
    minWidth: 80,
  },
  dayRecordAmount: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  dayRecordAmountVES: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 1,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 40,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  goToCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
    marginTop: 16,
  },
  goToCalendarText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
});
