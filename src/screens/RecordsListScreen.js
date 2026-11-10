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
      'Borrar todo el mes',
      `¿Deseas borrar todas las guardias de ${MONTH_NAMES[month]} ${year}?`,
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

  return (
    <View style={styles.container}>
      {/* 1. Encabezado */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Resumen del Mes</Text>
          <Text style={styles.subtitle}>
            {MONTH_NAMES[month]} {year} • {items.length} día(s) con guardia
          </Text>
        </View>

        {items.length > 0 && (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={handleClear}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="trash-can-outline" size={20} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* 2. Botón Gigante de WhatsApp (Imposible perderse) */}
      <TouchableOpacity
        style={styles.whatsAppBtn}
        onPress={handleShareWhatsApp}
        activeOpacity={0.8}
      >
        <MaterialCommunityIcons name="whatsapp" size={26} color="#FFFFFF" />
        <View style={styles.whatsAppTextCol}>
          <Text style={styles.whatsAppTitle}>Enviar Reporte por WhatsApp</Text>
          <Text style={styles.whatsAppSub}>Envía el cálculo quincenal a tu supervisor</Text>
        </View>
        <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
      </TouchableOpacity>

      {/* 3. Barra Resumen de Quincenas */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>DÍA 1</Text>
          <Text style={[styles.summaryUSD, { color: '#10B981' }]}>
            {formatUSD(calculation.firstCutTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={styles.summaryVES}>{formatVES(calculation.firstCutTotal * bcvRate)}</Text>
          )}
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>DÍA 15</Text>
          <Text style={[styles.summaryUSD, { color: '#818CF8' }]}>
            {formatUSD(calculation.secondCutTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={styles.summaryVES}>{formatVES(calculation.secondCutTotal * bcvRate)}</Text>
          )}
        </View>

        <View style={styles.summaryDivider} />

        <View style={styles.summaryCol}>
          <Text style={styles.summaryLabel}>TOTAL MES</Text>
          <Text style={[styles.summaryUSD, { color: '#FFFFFF' }]}>
            {formatUSD(calculation.grandTotal)}
          </Text>
          {bcvRate > 0 && (
            <Text style={[styles.summaryVES, { color: '#34D399' }]}>
              {formatVES(calculation.grandTotal * bcvRate)}
            </Text>
          )}
        </View>
      </View>

      {/* 4. Lista de Días */}
      {items.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>Sin guardias este mes</Text>
          <Text style={styles.emptySub}>
            Toca el botón abajo para ir al Calendario y marcar tus días con 1 toque.
          </Text>
          {onSelectDay && (
            <TouchableOpacity
              style={styles.goToCalendarBtn}
              onPress={() => onSelectDay(1)}
              activeOpacity={0.8}
            >
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
              style={styles.dayCard}
              onPress={() => setEditingDay(item.day)}
              activeOpacity={0.7}
            >
              {/* Círculo con el número del día */}
              <View style={styles.dayCircle}>
                <Text style={styles.dayCircleText}>{item.day}</Text>
              </View>

              {/* Información del turno */}
              <View style={styles.dayInfo}>
                <Text style={styles.dayOfWeekText}>{item.fullDayOfWeek}</Text>

                <View style={styles.tagsRow}>
                  {item.isGuardia && (
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                      <Text style={[styles.tagText, { color: '#38BDF8' }]}>
                        🛡️ {settings?.guardDutyName || 'Regular'}
                      </Text>
                    </View>
                  )}

                  {item.isGuardiaCompleta && (
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
                      <Text style={[styles.tagText, { color: '#A855F7' }]}>
                        ⭐ {settings?.fullGuardDutyName || 'Completa'}
                      </Text>
                    </View>
                  )}

                  {item.isSpecialPay && (
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(251, 146, 60, 0.15)' }]}>
                      <Text style={[styles.tagText, { color: '#FB923C' }]}>
                        ✨ {settings?.specialPayName || 'Especial'}
                      </Text>
                    </View>
                  )}

                  {item.overtimeHours > 0 && (
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(251, 191, 36, 0.15)' }]}>
                      <Text style={[styles.tagText, { color: '#FBBF24' }]}>
                        ⏱️ +{item.overtimeHours}h
                      </Text>
                    </View>
                  )}

                  {item.isWeekend && (
                    <View style={[styles.tagPill, { backgroundColor: 'rgba(244, 114, 182, 0.15)' }]}>
                      <Text style={[styles.tagText, { color: '#F472B6' }]}>
                        🏖️ Finde
                      </Text>
                    </View>
                  )}
                </View>

                {item.notes && item.notes.trim().length > 0 && (
                  <Text style={styles.notesText} numberOfLines={1}>
                    📝 {item.notes}
                  </Text>
                )}
              </View>

              {/* Subtotal del día */}
              <View style={styles.dayAmountCol}>
                <Text style={styles.dayUSD}>+{formatUSD(item.totalDayExtra)}</Text>
                {bcvRate > 0 && (
                  <Text style={styles.dayVES}>+{formatVES(item.totalDayExtra * bcvRate)}</Text>
                )}
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Modal para editar día */}
      {editingDay && (
        <DayModal
          visible={!!editingDay}
          day={editingDay}
          month={month}
          year={year}
          initialRecord={records[editingDay] || null}
          settings={settings}
          onClose={() => setEditingDay(null)}
          onSave={(dayData) => {
            if (onSaveDay) onSaveDay(year, month, editingDay, dayData);
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  clearBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    padding: 8,
    borderRadius: 12,
  },
  whatsAppBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    marginHorizontal: 16,
    marginVertical: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    gap: 12,
    elevation: 4,
  },
  whatsAppTextCol: {
    flex: 1,
  },
  whatsAppTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  whatsAppSub: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  summaryBar: {
    flexDirection: 'row',
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  summaryCol: {
    flex: 1,
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  summaryLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  summaryUSD: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 2,
  },
  summaryVES: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 30,
    gap: 8,
  },
  dayCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    justifyContent: 'space-between',
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  dayCircleText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10B981',
  },
  dayInfo: {
    flex: 1,
    paddingHorizontal: 10,
  },
  dayOfWeekText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tagPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  notesText: {
    fontSize: 10,
    color: '#FBBF24',
    marginTop: 4,
    fontStyle: 'italic',
  },
  dayAmountCol: {
    alignItems: 'flex-end',
    minWidth: 70,
  },
  dayUSD: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10B981',
  },
  dayVES: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    fontWeight: '600',
  },
  emptyBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  goToCalendarBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
  },
  goToCalendarText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#090D16',
  },
});
