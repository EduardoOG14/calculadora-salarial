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

  // Cálculo en tiempo real
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

  // Pincel rápido (1 Toque directo)
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

  const handleBatchApply = (daysArray, patchData) => {
    if (onSaveMultipleDays && daysArray.length > 0) {
      onSaveMultipleDays(year, month, daysArray, patchData);
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
        {/* Barra superior minimalista */}
        <View style={styles.topBar}>
          <View>
            <Text style={styles.appTitle}>Calculadora Salarial</Text>
            <Text style={styles.appSubtitle}>Toca los días para marcar tus guardias</Text>
          </View>

          <TouchableOpacity
            style={styles.shareBtn}
            onPress={handleShareSummary}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="share-variant" size={20} color="#10B981" />
          </TouchableOpacity>
        </View>

        {/* Tarjeta de Salario Simplificada */}
        <SalarySummaryCard
          calculation={calculation}
          periodName={`${MONTH_NAMES[month]} ${year}`}
          bcvRate={bcvRate}
          bcvLoading={bcvLoading}
          onRefreshBcv={onRefreshBcv}
        />

        {/* Calendario ultra intuitivo con Modo Pincel */}
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
      </ScrollView>

      {/* Modal para detalles/notas si se mantiene presionado un día */}
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
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
});
