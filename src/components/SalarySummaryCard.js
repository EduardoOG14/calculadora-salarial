import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { COLORS } from '../constants/theme';
import { formatUSD, formatVES } from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SalarySummaryCard({
  calculation,
  periodName,
  bcvRate = 0,
  bcvLoading = false,
  onRefreshBcv,
}) {
  const [expanded, setExpanded] = useState(false);

  const {
    baseSalary,
    firstCutPercent = 50,
    secondCutPercent = 50,
    baseSalaryFirstCut = 0,
    baseSalarySecondCut = 0,
    firstCutTotal = 0,
    secondCutTotal = 0,
    totalOvertimeHours,
    overtimeRate,
    overtimeTotalPay,
    totalGuardDays,
    guardRate,
    guardTotalPay,
    totalFullGuardDays,
    fullGuardRate,
    fullGuardTotalPay,
    totalWeekendDays,
    weekendRate,
    weekendTotalPay,
    totalSpecialDays,
    specialTotalPay,
    extrasTotalPay,
    grandTotal,
  } = calculation;

  const firstCutVES = bcvRate > 0 ? firstCutTotal * bcvRate : 0;
  const secondCutVES = bcvRate > 0 ? secondCutTotal * bcvRate : 0;
  const grandTotalVES = bcvRate > 0 ? grandTotal * bcvRate : 0;

  return (
    <View style={styles.card}>
      {/* Encabezado */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerPeriod}>{periodName.toUpperCase()}</Text>
          <Text style={styles.headerTitle}>Cortes Quincenales (1 y 15)</Text>
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>USD $</Text>
          </View>
          {bcvRate > 0 && (
            <View style={[styles.badge, styles.badgeVES]}>
              <Text style={styles.badgeTextVES}>Bs. BCV</Text>
            </View>
          )}
        </View>
      </View>

      {/* Tarjetas de Cortes 1 y 15 */}
      <View style={styles.cutsContainer}>
        {/* CORTE DÍA 1 */}
        <View style={styles.cutCard}>
          <View style={styles.cutHeaderRow}>
            <View style={[styles.cutBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="calendar-today" size={12} color={COLORS.primaryLight} />
              <Text style={[styles.cutBadgeText, { color: COLORS.primaryLight }]}>DÍA 1</Text>
            </View>
            <Text style={styles.cutSubTitle}>{firstCutPercent}% Base + Extras</Text>
          </View>

          <Text style={styles.cutAmountFirst}>{formatUSD(firstCutTotal)}</Text>

          {bcvRate > 0 && (
            <Text style={styles.cutAmountVES}>
              ≈ {formatVES(firstCutVES)}
            </Text>
          )}

          <View style={styles.cutDetailsRow}>
            <Text style={styles.cutDetailItem}>
              Base: {formatUSD(baseSalaryFirstCut)}
            </Text>
            <Text style={[styles.cutDetailItem, { color: COLORS.primaryLight, fontWeight: '700' }]}>
              Extras: +{formatUSD(extrasTotalPay)}
            </Text>
          </View>
        </View>

        {/* CORTE DÍA 15 */}
        <View style={styles.cutCard}>
          <View style={styles.cutHeaderRow}>
            <View style={[styles.cutBadge, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={12} color={COLORS.indigoLight} />
              <Text style={[styles.cutBadgeText, { color: COLORS.indigoLight }]}>DÍA 15</Text>
            </View>
            <Text style={styles.cutSubTitle}>{secondCutPercent}% Base restante</Text>
          </View>

          <Text style={styles.cutAmountSecond}>{formatUSD(secondCutTotal)}</Text>

          {bcvRate > 0 && (
            <Text style={styles.cutAmountVES}>
              ≈ {formatVES(secondCutVES)}
            </Text>
          )}

          <View style={styles.cutDetailsRow}>
            <Text style={styles.cutDetailItem}>
              Base: {formatUSD(baseSalarySecondCut)}
            </Text>
            <Text style={[styles.cutDetailItem, { color: COLORS.textMuted }]}>
              Sin extras
            </Text>
          </View>
        </View>
      </View>

      {/* Barra de Total General del Mes y Tasa BCV */}
      <View style={styles.monthTotalBar}>
        <View>
          <Text style={styles.monthTotalLabel}>TOTAL ACUMULADO DEL MES</Text>
          <Text style={styles.monthTotalAmount}>{formatUSD(grandTotal)}</Text>
        </View>

        {bcvRate > 0 && (
          <View style={styles.monthTotalRight}>
            <View style={styles.bcvFlagRow}>
              <Text style={styles.monthTotalVES}>{formatVES(grandTotalVES)}</Text>
              {onRefreshBcv && (
                <TouchableOpacity
                  style={styles.bcvRefreshBtn}
                  onPress={onRefreshBcv}
                  disabled={bcvLoading}
                  activeOpacity={0.7}
                >
                  {bcvLoading ? (
                    <ActivityIndicator size="small" color={COLORS.primaryLight} />
                  ) : (
                    <MaterialCommunityIcons name="refresh" size={13} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              )}
            </View>
            <Text style={styles.bcvRateInline}>Tasa BCV: {formatVES(bcvRate)}/USD</Text>
          </View>
        )}
      </View>

      {/* Resumen rápido de extras */}
      <View style={styles.quickStatsRow}>
        <View style={styles.quickStatItem}>
          <Text style={styles.quickStatLabel}>Base Total</Text>
          <Text style={styles.quickStatValue}>{formatUSD(baseSalary)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: COLORS.overtime }]}>
            Extras ({totalOvertimeHours}h)
          </Text>
          <Text style={styles.quickStatValue}>{formatUSD(overtimeTotalPay)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: COLORS.guardia }]}>
            Guardias ({totalGuardDays + totalFullGuardDays})
          </Text>
          <Text style={styles.quickStatValue}>{formatUSD(guardTotalPay + fullGuardTotalPay)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: COLORS.special }]}>
            G. Especial ({totalSpecialDays})
          </Text>
          <Text style={styles.quickStatValue}>{formatUSD(specialTotalPay)}</Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.quickStatItem}>
          <Text style={[styles.quickStatLabel, { color: COLORS.weekend }]}>
            Finde ({totalWeekendDays})
          </Text>
          <Text style={styles.quickStatValue}>{formatUSD(weekendTotalPay)}</Text>
        </View>
      </View>

      {/* Botón para ver u ocultar desglose detallado */}
      <TouchableOpacity
        style={styles.expandButton}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.expandButtonText}>
          {expanded ? 'Ocultar desglose detallado' : 'Ver desglose detallado'}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {/* Desglose Expandible */}
      {expanded && (
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="cash" size={16} color={COLORS.primary} />
              <Text style={styles.breakdownLabel}> Salario Base Completo</Text>
            </View>
            <Text style={styles.breakdownValue}>{formatUSD(baseSalary)}</Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={COLORS.overtime} />
              <Text style={styles.breakdownLabel}>
                {' '}{calculation.overtimeName || 'Horas extras'} ({totalOvertimeHours}h × {formatUSD(overtimeRate)})
              </Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.overtime }]}>
              +{formatUSD(overtimeTotalPay)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="shield-outline" size={16} color={COLORS.guardia} />
              <Text style={styles.breakdownLabel}>
                {' '}{calculation.guardDutyName || 'Guardia regular'} ({totalGuardDays}d × {formatUSD(guardRate)})
              </Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.guardia }]}>
              +{formatUSD(guardTotalPay)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="shield-star-outline" size={16} color={COLORS.guardiaCompleta} />
              <Text style={styles.breakdownLabel}>
                {' '}{calculation.fullGuardDutyName || 'Guardia completa'} ({totalFullGuardDays}d × {formatUSD(fullGuardRate)})
              </Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.guardiaCompleta }]}>
              +{formatUSD(fullGuardTotalPay)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="beach" size={16} color={COLORS.weekend} />
              <Text style={styles.breakdownLabel}>
                {' '}{calculation.weekendName || 'Fines de semana'} ({totalWeekendDays}d × {formatUSD(weekendRate)})
              </Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.weekend }]}>
              +{formatUSD(weekendTotalPay)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <MaterialCommunityIcons name="star-circle-outline" size={16} color={COLORS.special} />
              <Text style={styles.breakdownLabel}>
                {' '}{calculation.specialPayName || 'Guardia especial'} ({totalSpecialDays}d)
              </Text>
            </View>
            <Text style={[styles.breakdownValue, { color: COLORS.special }]}>
              +{formatUSD(specialTotalPay)}
            </Text>
          </View>

          <View style={styles.breakdownTotalExtras}>
            <Text style={styles.totalExtrasText}>Total Extras Ganados (Cobrados el día 1):</Text>
            <Text style={styles.totalExtrasAmount}>+{formatUSD(extrasTotalPay)}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerPeriod: {
    color: COLORS.indigoLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    backgroundColor: COLORS.primaryBg,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  badgeVES: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: COLORS.indigo,
  },
  badgeTextVES: {
    color: COLORS.indigoLight,
    fontSize: 10,
    fontWeight: '700',
  },
  cutsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 6,
  },
  cutCard: {
    flex: 1,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'space-between',
  },
  cutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  cutBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  cutSubTitle: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cutAmountFirst: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
  cutAmountSecond: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.indigoLight,
  },
  cutAmountVES: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  cutDetailsRow: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(51, 65, 85, 0.6)',
    gap: 2,
  },
  cutDetailItem: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  monthTotalBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 6,
  },
  monthTotalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  monthTotalAmount: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
  },
  monthTotalRight: {
    alignItems: 'flex-end',
  },
  bcvFlagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  monthTotalVES: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34D399',
  },
  bcvRefreshBtn: {
    padding: 3,
    backgroundColor: COLORS.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bcvRateInline: {
    fontSize: 9,
    color: COLORS.indigoLight,
    fontWeight: '600',
    marginTop: 1,
  },
  quickStatsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 4,
  },
  quickStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  quickStatLabel: {
    fontSize: 9,
    color: COLORS.textMuted,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickStatValue: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.border,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 4,
  },
  expandButtonText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
    marginRight: 4,
  },
  breakdownContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 3,
  },
  breakdownLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  breakdownTotalExtras: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  totalExtrasText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },
  totalExtrasAmount: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
  },
});
