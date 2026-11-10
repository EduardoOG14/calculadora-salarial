import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from 'react-native';
import { COLORS } from '../constants/theme';
import SalarySummaryCard from '../components/SalarySummaryCard';
import CalendarView from '../components/CalendarView';
import DayModal from '../components/DayModal';
import {
  calculateSalary,
  generateShareText,
  MONTH_NAMES,
} from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({
  settings,
  year,
  month,
  records,
  bcvRate = 0,
  bcvLoading = false,
  onRefreshBcv,
  onPrevMonth,
  onNextMonth,
  onSaveDay,
  onSaveMultipleDays,
  onClearMonth,
  onSaveSettings,
}) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Calcular salario del mes completo en tiempo real
  const calculation = calculateSalary(settings, records, year, month);

  // Abrir modal de inspección / detalle para un día
  const handleOpenDay = (day) => {
    setSelectedDay(day);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedDay(null);
  };

  const handleSaveDayRecord = (dayData) => {
    if (selectedDay) {
      onSaveDay(year, month, selectedDay, dayData);
    }
  };

  // Manejo directo de Pincel Activo (Don't Make Me Think - 1 solo toque)
  const handleQuickApplyBrush = (day, brushType) => {
    const current = records[day] || {};
    let updated = { ...current };

    if (brushType === 'guardia') {
      updated.isGuardia = !current.isGuardia;
    } else if (brushType === 'guardiaCompleta') {
      updated.isGuardiaCompleta = !current.isGuardiaCompleta;
    } else if (brushType === 'special') {
      const nextSpecial = !current.isSpecialPay;
      updated.isSpecialPay = nextSpecial;
      if (nextSpecial && !updated.specialPayAmount) {
        updated.specialPayAmount = Number(settings.specialPayRate) || 50;
      }
    } else if (brushType === 'weekend') {
      updated.isWeekend = !current.isWeekend;
    } else if (brushType === 'overtime') {
      const currentHours = Number(current.overtimeHours) || 0;
      const nextHours = currentHours + 1;
      updated.overtimeHours = nextHours > 12 ? 0 : nextHours;
    } else if (brushType === 'eraser') {
      updated = {
        isGuardia: false,
        isGuardiaCompleta: false,
        isSpecialPay: false,
        overtimeHours: 0,
        isWeekend: false,
        notes: '',
      };
    }

    onSaveDay(year, month, day, updated);
  };

  // Aplicación en lote (Semana actual, Fines de semana, Todo el mes)
  const handleBatchApply = (daysArray, patchData) => {
    if (onSaveMultipleDays && daysArray.length > 0) {
      onSaveMultipleDays(year, month, daysArray, patchData);
    }
  };

  // Compartir resumen por WhatsApp u otras apps con 1 toque
  const handleShareSummary = async () => {
    try {
      const text = generateShareText(calculation, settings, year, month, bcvRate);
      await Share.share({
        message: text,
        title: `Resumen Salarial ${MONTH_NAMES[month]} ${year}`,
      });
    } catch (error) {
      console.log('Error sharing:', error);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Barra superior */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>Calculadora Salarial</Text>
            <Text style={styles.appSubtitle}>
              {MONTH_NAMES[month]} {year} • Moneda: USD ($)
            </Text>
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareSummary}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color={COLORS.primaryLight} />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de cálculo automático con Cortes Quincenales 1 y 15 */}
        <SalarySummaryCard
          calculation={calculation}
          periodName={`${MONTH_NAMES[month]} ${year}`}
          bcvRate={bcvRate}
          bcvLoading={bcvLoading}
          onRefreshBcv={onRefreshBcv}
        />

        {/* Calendario interactivo con Modo Pincel ("Don't Make Me Think") */}
        <CalendarView
          year={year}
          month={month}
          records={records}
          settings={settings}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onSelectDay={handleOpenDay}
          onQuickApplyBrush={handleQuickApplyBrush}
          onBatchApply={handleBatchApply}
          onClearMonth={onClearMonth}
        />

        {/* Ayuda contextual sutil */}
        <View style={styles.hintBox}>
          <MaterialCommunityIcons name="gesture-tap" size={16} color={COLORS.indigoLight} />
          <Text style={styles.hintText}>
            Toca directamente cualquier día para marcarlo con la herramienta activa. Mantén presionado un día para añadir notas o montos específicos.
          </Text>
        </View>
      </ScrollView>

      {/* Modal para inspeccionar/añadir notas a un día específico */}
      <DayModal
        visible={modalVisible}
        day={selectedDay}
        month={month}
        year={year}
        initialRecord={selectedDay ? records[selectedDay] : null}
        settings={settings}
        onClose={handleCloseModal}
        onSave={handleSaveDayRecord}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 6,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  shareBtn: {
    backgroundColor: COLORS.surfaceLight,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 10,
    backgroundColor: 'rgba(99, 102, 241, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  hintText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.indigoLight,
    lineHeight: 16,
    fontWeight: '500',
  },
});
