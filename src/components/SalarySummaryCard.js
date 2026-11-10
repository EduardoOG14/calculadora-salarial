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
  const [showDetail, setShowDetail] = useState(false);

  const {
    baseSalary = 0,
    firstCutTotal = 0,
    secondCutTotal = 0,
    grandTotal = 0,
    totalGuardDays = 0,
    guardTotalPay = 0,
    totalFullGuardDays = 0,
    fullGuardTotalPay = 0,
    totalWeekendDays = 0,
    weekendTotalPay = 0,
    totalSpecialDays = 0,
    specialTotalPay = 0,
    totalOvertimeHours = 0,
    overtimeTotalPay = 0,
    extrasTotalPay = 0,
  } = calculation;

  const firstCutVES = bcvRate > 0 ? firstCutTotal * bcvRate : 0;
  const secondCutVES = bcvRate > 0 ? secondCutTotal * bcvRate : 0;
  const grandTotalVES = bcvRate > 0 ? grandTotal * bcvRate : 0;

  return (
    <View style={styles.container}>
      {/* Barra superior: Mes y Tasa BCV */}
      <View style={styles.topRow}>
        <Text style={styles.monthTitle}>{periodName}</Text>

        {bcvRate > 0 && (
          <TouchableOpacity
            style={styles.bcvPill}
            onPress={onRefreshBcv}
            disabled={bcvLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.bcvFlag}>🇻🇪</Text>
            <Text style={styles.bcvText}>
              Bs. {bcvRate.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>
            {bcvLoading ? (
              <ActivityIndicator size="small" color={COLORS.primaryLight} style={{ marginLeft: 4 }} />
            ) : (
              <MaterialCommunityIcons name="refresh" size={14} color={COLORS.textSecondary} style={{ marginLeft: 3 }} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Las dos quincenas: grandes, limpias y ultra legibles */}
      <View style={styles.cardsRow}>
        {/* Quincena 1 */}
        <View style={[styles.quincenaCard, styles.quincenaCardFirst]}>
          <View style={styles.pillTagFirst}>
            <Text style={styles.pillTagFirstText}>PAGO DÍA 1 ({calculation.firstCutPercent || 50}%)</Text>
          </View>
          <Text style={styles.amountUSDFirst}>{formatUSD(firstCutTotal)}</Text>
          {bcvRate > 0 && (
            <Text style={styles.amountVES}>≈ {formatVES(firstCutVES)}</Text>
          )}
          <Text style={styles.quincenaFoot}>Base + Extras</Text>
        </View>

        {/* Quincena 2 */}
        <View style={[styles.quincenaCard, styles.quincenaCardSecond]}>
          <View style={styles.pillTagSecond}>
            <Text style={styles.pillTagSecondText}>PAGO DÍA 15 ({calculation.secondCutPercent || 50}%)</Text>
          </View>
          <Text style={[styles.amountUSDSecond, { color: '#818CF8' }]}>{formatUSD(secondCutTotal)}</Text>
          {bcvRate > 0 && (
            <Text style={styles.amountVES}>≈ {formatVES(secondCutVES)}</Text>
          )}
          <Text style={styles.quincenaFoot}>Segunda quincena</Text>
        </View>
      </View>

      {/* Banner de Total del Mes */}
      <View style={styles.totalBanner}>
        <View style={styles.totalLeft}>
          <Text style={styles.totalLabel}>TOTAL DEL MES</Text>
          <Text style={styles.totalUSD}>{formatUSD(grandTotal)}</Text>
        </View>

        {bcvRate > 0 && (
          <View style={styles.totalRight}>
            <Text style={styles.totalVES}>{formatVES(grandTotalVES)}</Text>
          </View>
        )}
      </View>

      {/* Botón simple para ver desglose si se desea */}
      {extrasTotalPay > 0 && (
        <TouchableOpacity
          style={styles.detailToggle}
          onPress={() => setShowDetail(!showDetail)}
          activeOpacity={0.7}
        >
          <Text style={styles.detailToggleText}>
            {showDetail ? 'Ocultar desglose ▲' : `Ver desglose (+${formatUSD(extrasTotalPay)} en extras) ▼`}
          </Text>
        </TouchableOpacity>
      )}

      {/* Desglose colapsable súper limpio */}
      {showDetail && (
        <View style={styles.detailBox}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Sueldo base mensual</Text>
            <Text style={styles.detailValue}>{formatUSD(baseSalary)}</Text>
          </View>

          {totalGuardDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🛡️ Guardias regulares ({totalGuardDays})</Text>
              <Text style={styles.detailValue}>+{formatUSD(guardTotalPay)}</Text>
            </View>
          )}

          {totalFullGuardDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⭐ Guardias completas ({totalFullGuardDays})</Text>
              <Text style={styles.detailValue}>+{formatUSD(fullGuardTotalPay)}</Text>
            </View>
          )}

          {totalSpecialDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>✨ Guardias especiales ({totalSpecialDays})</Text>
              <Text style={styles.detailValue}>+{formatUSD(specialTotalPay)}</Text>
            </View>
          )}

          {totalWeekendDays > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>🏖️ Fines de semana ({totalWeekendDays})</Text>
              <Text style={styles.detailValue}>+{formatUSD(weekendTotalPay)}</Text>
            </View>
          )}

          {totalOvertimeHours > 0 && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏱️ Horas extras ({totalOvertimeHours}h)</Text>
              <Text style={styles.detailValue}>+{formatUSD(overtimeTotalPay)}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 22,
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  bcvPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  bcvFlag: {
    fontSize: 12,
    marginRight: 4,
  },
  bcvText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  quincenaCard: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
  },
  quincenaCardFirst: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  quincenaCardSecond: {
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderColor: 'rgba(99, 102, 241, 0.3)',
  },
  pillTagFirst: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  pillTagFirstText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34D399',
  },
  pillTagSecond: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  pillTagSecondText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#A5B4FC',
  },
  amountUSDFirst: {
    fontSize: 22,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: -0.5,
  },
  amountUSDSecond: {
    fontSize: 22,
    fontWeight: '900',
    color: '#818CF8',
    letterSpacing: -0.5,
  },
  amountVES: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 2,
  },
  quincenaFoot: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  totalBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  totalLeft: {
    gap: 2,
  },
  totalLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  totalUSD: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  totalRight: {
    alignItems: 'flex-end',
  },
  totalVES: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34D399',
  },
  detailToggle: {
    alignItems: 'center',
    paddingTop: 10,
  },
  detailToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  detailBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
