import React from 'react';
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
  FULL_DAY_NAMES,
  calculateSalary,
  formatUSD,
  formatVES,
  generateShareText,
} from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function RecordsListScreen({
  settings,
  year,
  month,
  records,
  bcvRate = 0,
  onClearMonth,
  onSelectDay,
}) {
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

  const handleShare = async () => {
    try {
      const text = generateShareText(calculation, settings, year, month, bcvRate);
      await Share.share({
        message: text,
        title: `Resumen de Actividades - ${MONTH_NAMES[month]} ${year}`,
      });
    } catch (e) {
      console.log('Error compartiendo:', e);
    }
  };

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Historial y Desglose</Text>
          <Text style={styles.subtitle}>
            {MONTH_NAMES[month]} {year} • {items.length} día(s) con actividad
          </Text>
        </View>

        <View style={styles.headerActions}>
          {items.length > 0 && (
            <>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={handleShare}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primaryLight} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.iconBtn, styles.clearBtn]}
                onPress={handleClear}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Tarjeta resumen rápido con Cortes 1 y 15 */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Pago Día 1 ({calculation.firstCutPercent}%)</Text>
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
          <Text style={styles.summaryLabel}>Pago Día 15 ({calculation.secondCutPercent}%)</Text>
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
          <Text style={styles.summaryLabel}>Total Mes</Text>
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

      {/* Lista de registros */}
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={64} color={COLORS.borderLight} />
          <Text style={styles.emptyTitle}>No hay registros este mes</Text>
          <Text style={styles.emptySub}>
            Toca los días en el calendario para marcar guardias, horas extras o fines de semana trabajados.
          </Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => String(item.day)}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => onSelectDay(item.day)}
              activeOpacity={0.7}
            >
              {/* Columna Día */}
              <View style={styles.dayCol}>
                <Text style={styles.dayNum}>{item.day}</Text>
                <Text style={styles.dayWk}>{item.dayOfWeek}</Text>
              </View>

              {/* Columna Detalles */}
              <View style={styles.detailsCol}>
                <View style={styles.badgesRow}>
                  {item.isGuardia && (
                    <View style={[styles.badge, { backgroundColor: COLORS.guardiaBg }]}>
                      <MaterialCommunityIcons name="shield" size={12} color={COLORS.guardia} />
                      <Text style={[styles.badgeTxt, { color: COLORS.guardia }]}>
                        {settings?.guardDutyName || 'Guardia'} (+{formatUSD(item.guardPay)})
                      </Text>
                    </View>
                  )}

                  {item.isGuardiaCompleta && (
                    <View style={[styles.badge, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                      <MaterialCommunityIcons name="shield-star" size={12} color={COLORS.guardiaCompleta} />
                      <Text style={[styles.badgeTxt, { color: COLORS.guardiaCompleta }]}>
                        {settings?.fullGuardDutyName || 'Guardia Compl.'} (+{formatUSD(item.fullGuardPay)})
                      </Text>
                    </View>
                  )}

                  {item.overtimeHours > 0 && (
                    <View style={[styles.badge, { backgroundColor: COLORS.overtimeBg }]}>
                      <MaterialCommunityIcons name="clock-outline" size={12} color={COLORS.overtime} />
                      <Text style={[styles.badgeTxt, { color: COLORS.overtime }]}>
                        {item.overtimeHours}h {settings?.overtimeName?.toLowerCase() || 'extras'} (+{formatUSD(item.overtimePay)})
                      </Text>
                    </View>
                  )}

                  {item.isWeekend && (
                    <View style={[styles.badge, { backgroundColor: COLORS.weekendBg }]}>
                      <MaterialCommunityIcons name="beach" size={12} color={COLORS.weekend} />
                      <Text style={[styles.badgeTxt, { color: COLORS.weekend }]}>
                        {settings?.weekendName || 'Fin de sem.'} (+{formatUSD(item.weekendPay)})
                      </Text>
                    </View>
                  )}

                  {item.isSpecialPay && (
                    <View style={[styles.badge, { backgroundColor: COLORS.specialBg }]}>
                      <MaterialCommunityIcons name="star" size={12} color={COLORS.special} />
                      <Text style={[styles.badgeTxt, { color: COLORS.special }]}>
                        {settings?.specialPayName || 'Guardia Especial'} (+{formatUSD(item.specialPay)})
                      </Text>
                    </View>
                  )}
                </View>

                {item.notes ? (
                  <Text style={styles.notesText} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                ) : null}
              </View>

              {/* Columna Monto Total Día */}
              <View style={styles.amountCol}>
                <Text style={styles.dayTotalAmount}>+{formatUSD(item.totalDayExtra)}</Text>
                <MaterialCommunityIcons name="pencil-outline" size={14} color={COLORS.textMuted} />
              </View>
            </TouchableOpacity>
          )}
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
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtn: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '700',
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  summaryValVES: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  dayCol: {
    width: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    paddingRight: 8,
  },
  dayNum: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  dayWk: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  detailsCol: {
    flex: 1,
    paddingHorizontal: 10,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  badgeTxt: {
    fontSize: 10,
    fontWeight: '700',
  },
  notesText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
    fontStyle: 'italic',
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
  },
  dayTotalAmount: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
});
