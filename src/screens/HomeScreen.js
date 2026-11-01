import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import SalarySummaryCard from '../components/SalarySummaryCard';
import CalendarView from '../components/CalendarView';
import DayModal from '../components/DayModal';
import MultiDayModal from '../components/MultiDayModal';
import { calculateSalary, generateShareText, MONTH_NAMES } from '../utils/calculator';
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
  onSaveSettings,
}) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  // Estado para selección múltiple de días
  const [multiSelectedDays, setMultiSelectedDays] = useState([]);
  const [multiModalVisible, setMultiModalVisible] = useState(false);

  // Calcular salario del mes completo con cortes 1 y 15
  const calculation = calculateSalary(settings, records, year, month);

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

  // Abrir modal de asignación múltiple
  const handleOpenMultiSelectModal = (days) => {
    setMultiSelectedDays(days);
    setMultiModalVisible(true);
  };

  const handleCloseMultiModal = () => {
    setMultiModalVisible(false);
  };

  const handleApplyMultiDays = (patchData) => {
    if (onSaveMultipleDays && multiSelectedDays.length > 0) {
      onSaveMultipleDays(year, month, multiSelectedDays, patchData);
    }
  };

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
        {/* Barra superior de la App */}
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

        {/* Tarjeta de cálculo automático de salario del mes */}
        <SalarySummaryCard
          calculation={calculation}
          periodName={`${MONTH_NAMES[month]} ${year}`}
          bcvRate={bcvRate}
          bcvLoading={bcvLoading}
          onRefreshBcv={onRefreshBcv}
        />

        {/* Calendario interactivo de días con soporte para selección múltiple */}
        <CalendarView
          year={year}
          month={month}
          records={records}
          settings={settings}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onSelectDay={handleOpenDay}
          onOpenMultiSelectModal={handleOpenMultiSelectModal}
        />

        <View style={styles.instructionsBox}>
          <MaterialCommunityIcons name="information-outline" size={18} color={COLORS.indigoLight} />
          <Text style={styles.instructionsText}>
            💡 Tip: Mantén presionado cualquier día para activar la selección múltiple al instante o para abarcar tramos enteros de fechas con feedback táctil.
          </Text>
        </View>
      </ScrollView>

      {/* Modal para configurar un solo día */}
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

      {/* Modal para configurar múltiples días a la vez */}
      <MultiDayModal
        visible={multiModalVisible}
        selectedDays={multiSelectedDays}
        month={month}
        year={year}
        settings={settings}
        onClose={handleCloseMultiModal}
        onApply={handleApplyMultiDays}
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
    paddingBottom: 40,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
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
  instructionsBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginVertical: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 10,
  },
  instructionsText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
});
