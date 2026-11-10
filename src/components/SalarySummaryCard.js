import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
    totalOvertimeHours = 0,
    overtimeRate = 0,
    overtimeTotalPay = 0,
    totalGuardDays = 0,
    guardRate = 0,
    guardTotalPay = 0,
    totalFullGuardDays = 0,
    fullGuardRate = 0,
    fullGuardTotalPay = 0,
    totalWeekendDays = 0,
    weekendRate = 0,
    weekendTotalPay = 0,
    totalSpecialDays = 0,
    specialTotalPay = 0,
    extrasTotalPay = 0,
    grandTotal = 0,
  } = calculation;

  const firstCutVES = bcvRate > 0 ? firstCutTotal * bcvRate : 0;
  const secondCutVES = bcvRate > 0 ? secondCutTotal * bcvRate : 0;
  const grandTotalVES = bcvRate > 0 ? grandTotal * bcvRate : 0;

  return (
    <View style={styles.card}>
      {/* 1. Encabezado con Período y Tasa Oficial BCV */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.periodText}>{periodName.toUpperCase()}</Text>
          <Text style={styles.headerSubtitle}>Cortes Quincenales (1 y 15)</Text>
        </View>

        {bcvRate > 0 && (
          <TouchableOpacity
            style={styles.bcvBadge}
            onPress={onRefreshBcv}
            disabled={bcvLoading}
            activeOpacity={0.7}
          >
            <View style={styles.bcvDot} />
            <Text style={styles.bcvText}>
              BCV: {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Bs/$
            </Text>
            {bcvLoading ? (
              <ActivityIndicator size="small" color={COLORS.primaryLight} style={{ marginLeft: 4 }} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={13} color={COLORS.textSecondary} style={{ marginLeft: 4 }} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Tarjetas de Cortes 1 y 15 (Directo a la vista) */}
      <View style={styles.cutsRow}>
        {/* CORTE DÍA 1 */}
        <View style={[styles.cutBox, styles.cutBoxFirst]}>
          <View style={styles.cutBadgeRow}>
            <View style={[styles.cutPill, { backgroundColor: 'rgba(16, 185, 129, 0.2)' }]}>
              <MaterialCommunityIcons name="calendar-check" size={12} color={COLORS.primaryLight} />
              <Text style={[styles.cutPillText, { color: COLORS.primaryLight }]}>DÍA 1</Text>
            </View>
            <Text style={styles.cutPercentText}>{firstCutPercent}% + Extras</Text>
          </View>

          <Text style={styles.cutAmountUSD}>{formatUSD(firstCutTotal)}</Text>
          {bcvRate > 0 && (
            <Text style={styles.cutAmountVES}>≈ {formatVES(firstCutVES)}</Text>
          )}

          <View style={styles.cutBreakdownMini}>
            <Text style={styles.cutBreakdownText}>Base: {formatUSD(baseSalaryFirstCut)}</Text>
            {extrasTotalPay > 0 && (
              <Text style={[styles.cutBreakdownText, { color: COLORS.primaryLight, fontWeight: '700' }]}>
                Extras: +{formatUSD(extrasTotalPay)}
              </Text>
            )}
          </View>
        </View>

        {/* CORTE DÍA 15 */}
        <View style={[styles.cutBox, styles.cutBoxSecond]}>
          <View style={styles.cutBadgeRow}>
            <View style={[styles.cutPill, { backgroundColor: 'rgba(99, 102, 241, 0.2)' }]}>
              <MaterialCommunityIcons name="calendar-clock" size={12} color={COLORS.indigoLight} />
              <Text style={[styles.cutPillText, { color: COLORS.indigoLight }]}>DÍA 15</Text>
            </View>
            <Text style={styles.cutPercentText}>{secondCutPercent}% Base</Text>
          </View>

          <Text style={[styles.cutAmountUSD, { color: COLORS.indigoLight }]}>
            {formatUSD(secondCutTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={styles.cutAmountVES}>≈ {formatVES(secondCutVES)}</Text>
          )}

          <View style={styles.cutBreakdownMini}>
            <Text style={styles.cutBreakdownText}>Base: {formatUSD(baseSalarySecondCut)}</Text>
            <Text style={[styles.cutBreakdownText, { color: COLORS.textMuted }]}>
              (Sin extras)
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Barra Destacada de Total Acumulado del Mes */}
      <View style={styles.totalMonthBanner}>
        <View>
          <Text style={styles.totalMonthLabel}>TOTAL ESTIMADO DEL MES</Text>
          <Text style={styles.totalMonthAmount}>{formatUSD(grandTotal)}</Text>
        </View>

        {bcvRate > 0 && (
          <View style={styles.totalMonthRight}>
            <Text style={styles.totalMonthVESLabel}>Equivalente BCV</Text>
            <Text style={styles.totalMonthVES}>{formatVES(grandTotalVES)}</Text>
          </View>
        )}
      </View>

      {/* 4. Botón desplegable para ver desglose detallado */}
      <TouchableOpacity
        style={styles.expandToggleBtn}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
      >
        <Text style={styles.expandToggleText}>
          {expanded ? 'Ocultar desglose detallado' : 'Ver desglose detallado'}
        </Text>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={COLORS.primaryLight}
        />
      </TouchableOpacity>

      {/* 5. Desglose detallado colapsable */}
      {expanded && (
        <View style={styles.breakdownContainer}>
          <View style={styles.breakdownRow}>
            <Text style={styles.breakdownLabel}>Salario Base Total</Text>
            <Text style={styles.breakdownVal}>{formatUSD(baseSalary)}</Text>
          </View>

          {totalGuardDays > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeftBadge}>
                <View style={[styles.dot, { backgroundColor: COLORS.guardia }]} />
                <Text style={styles.breakdownLabel}>
                  Guardias Regulares ({totalGuardDays} × {formatUSD(guardRate)})
                </Text>
              </View>
              <Text style={styles.breakdownVal}>+{formatUSD(guardTotalPay)}</Text>
            </View>
          )}

          {totalFullGuardDays > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeftBadge}>
                <View style={[styles.dot, { backgroundColor: COLORS.guardiaCompleta }]} />
                <Text style={styles.breakdownLabel}>
                  Guardias Completas ({totalFullGuardDays} × {formatUSD(fullGuardRate)})
                </Text>
              </View>
              <Text style={styles.breakdownVal}>+{formatUSD(fullGuardTotalPay)}</Text>
            </View>
          )}

          {totalSpecialDays > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeftBadge}>
                <View style={[styles.dot, { backgroundColor: COLORS.special }]} />
                <Text style={styles.breakdownLabel}>
                  Guardias Especiales ({totalSpecialDays} días)
                </Text>
              </View>
              <Text style={styles.breakdownVal}>+{formatUSD(specialTotalPay)}</Text>
            </View>
          )}

          {totalWeekendDays > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeftBadge}>
                <View style={[styles.dot, { backgroundColor: COLORS.weekend }]} />
                <Text style={styles.breakdownLabel}>
                  Fines de Semana ({totalWeekendDays} × {formatUSD(weekendRate)})
                </Text>
              </View>
              <Text style={styles.breakdownVal}>+{formatUSD(weekendTotalPay)}</Text>
            </View>
          )}

          {totalOvertimeHours > 0 && (
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeftBadge}>
                <View style={[styles.dot, { backgroundColor: COLORS.overtime }]} />
                <Text style={styles.breakdownLabel}>
                  Horas Extras ({totalOvertimeHours}h × {formatUSD(overtimeRate)})
                </Text>
              </View>
              <Text style={styles.breakdownVal}>+{formatUSD(overtimeTotalPay)}</Text>
            </View>
          )}

          <View style={[styles.breakdownRow, styles.breakdownTotalRow]}>
            <Text style={styles.breakdownTotalLabel}>Total Extras Acumuladas</Text>
            <Text style={styles.breakdownTotalVal}>+{formatUSD(extrasTotalPay)}</Text>
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
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  periodText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  bcvBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bcvDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primaryLight,
    marginRight: 6,
  },
  bcvText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
  },
  cutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  cutBox: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  cutBoxFirst: {
    borderColor: 'rgba(16, 185, 129, 0.35)',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  cutBoxSecond: {
    borderColor: 'rgba(99, 102, 241, 0.35)',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  cutBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cutPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  cutPillText: {
    fontSize: 10,
    fontWeight: '900',
  },
  cutPercentText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  cutAmountUSD: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primaryLight,
    letterSpacing: -0.5,
  },
  cutAmountVES: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  cutBreakdownMini: {
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: 2,
  },
  cutBreakdownText: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  totalMonthBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 14,
    padding: 12,
  },
  totalMonthLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryLight,
    letterSpacing: 0.5,
  },
  totalMonthAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  totalMonthRight: {
    alignItems: 'flex-end',
  },
  totalMonthVESLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  totalMonthVES: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    marginTop: 8,
    gap: 4,
  },
  expandToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  breakdownContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  breakdownLeftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  breakdownLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  breakdownVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  breakdownTotalRow: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    marginTop: 4,
  },
  breakdownTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  breakdownTotalVal: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.primaryLight,
  },
});
