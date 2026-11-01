import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Switch,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  MONTH_NAMES,
  FULL_DAY_NAMES,
  isWeekendDay,
  formatUSD,
} from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function DayModal({
  visible,
  day,
  month,
  year,
  initialRecord,
  settings,
  onClose,
  onSave,
}) {
  const [isGuardia, setIsGuardia] = useState(false);
  const [isGuardiaCompleta, setIsGuardiaCompleta] = useState(false);
  const [isSpecialPay, setIsSpecialPay] = useState(false);
  const [specialPayAmount, setSpecialPayAmount] = useState(String(settings.specialPayRate ?? 50));
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [isWeekend, setIsWeekend] = useState(false);
  const [notes, setNotes] = useState('');

  // Sincronizar estado cuando se abre para un día
  useEffect(() => {
    if (visible && day) {
      const rec = initialRecord || {};
      const isCalWk = isWeekendDay(year, month, day);
      setIsGuardia(!!rec.isGuardia);
      setIsGuardiaCompleta(!!rec.isGuardiaCompleta);
      setIsSpecialPay(!!rec.isSpecialPay);
      
      const initialSpecialAmount = (rec.specialPayAmount !== undefined && rec.specialPayAmount !== null && !isNaN(Number(rec.specialPayAmount)))
        ? String(rec.specialPayAmount)
        : String(settings.specialPayRate ?? 50);
      setSpecialPayAmount(initialSpecialAmount);

      setOvertimeHours(rec.overtimeHours ? String(rec.overtimeHours) : '0');
      // Solo se habilita y permite fin de semana si el día es sábado o domingo
      setIsWeekend(isCalWk ? !!rec.isWeekend : false);
      setNotes(rec.notes || '');
    }
  }, [visible, day, initialRecord, settings.specialPayRate]);

  if (!day) return null;

  const dateObj = new Date(year, month, day);
  const fullDayName = FULL_DAY_NAMES[dateObj.getDay()];
  const isCalendarWeekend = isWeekendDay(year, month, day);

  const numHours = parseInt(overtimeHours, 10) || 0;
  const guardPay = isGuardia ? Number(settings.guardDutyRate) || 0 : 0;
  const fullGuardPay = isGuardiaCompleta ? Number(settings.fullGuardDutyRate) || 0 : 0;
  const numSpecialPay = isSpecialPay ? (parseFloat(specialPayAmount) || 0) : 0;
  const overtimePay = numHours * (Number(settings.overtimeRate) || 0);
  const weekendPay = (isCalendarWeekend && isWeekend) ? Number(settings.weekendRate) || 0 : 0;
  const totalDayExtra = guardPay + fullGuardPay + numSpecialPay + overtimePay + weekendPay;

  const handleHourChange = (delta) => {
    const current = parseInt(overtimeHours, 10) || 0;
    const updated = Math.max(0, current + delta);
    setOvertimeHours(String(updated));
  };

  const setPresetHours = (h) => {
    setOvertimeHours(String(h));
  };

  const handleSave = () => {
    onSave({
      isGuardia,
      isGuardiaCompleta,
      isSpecialPay,
      specialPayAmount: isSpecialPay ? (parseFloat(specialPayAmount) || Number(settings.specialPayRate) || 0) : undefined,
      overtimeHours: parseInt(overtimeHours, 10) || 0,
      isWeekend: isCalendarWeekend ? isWeekend : false,
      notes,
    });
    onClose();
  };

  const handleClear = () => {
    setIsGuardia(false);
    setIsGuardiaCompleta(false);
    setIsSpecialPay(false);
    setSpecialPayAmount(String(settings.specialPayRate ?? 50));
    setOvertimeHours('0');
    setIsWeekend(false);
    setNotes('');
    onSave({
      isGuardia: false,
      isGuardiaCompleta: false,
      isSpecialPay: false,
      specialPayAmount: undefined,
      overtimeHours: 0,
      isWeekend: false,
      notes: '',
    });
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <View style={styles.modalSheet}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetSubtitle}>{fullDayName.toUpperCase()}</Text>
              <Text style={styles.sheetTitle}>
                {day} de {MONTH_NAMES[month]} {year}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Opción 1: Guardia Regular */}
            <View style={[styles.optionCard, isGuardia && styles.optionCardActiveGuardia]}>
              <View style={styles.optionInfo}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.guardiaBg }]}>
                  <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.guardia} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{settings?.guardDutyName || 'Guardia Regular'}</Text>
                  <Text style={styles.optionSub}>
                    Tarifa: +{formatUSD(settings.guardDutyRate)} por día
                  </Text>
                </View>
              </View>
              <Switch
                value={isGuardia}
                onValueChange={setIsGuardia}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.guardiaDark }}
                thumbColor={isGuardia ? COLORS.guardia : '#cbd5e1'}
              />
            </View>

            {/* Opción 1.5: Guardia Completa */}
            <View style={[styles.optionCard, isGuardiaCompleta && styles.optionCardActiveGuardiaCompleta]}>
              <View style={styles.optionInfo}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                  <MaterialCommunityIcons name="shield-star" size={22} color={COLORS.guardiaCompleta} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{settings?.fullGuardDutyName || 'Guardia Completa'}</Text>
                  <Text style={styles.optionSub}>
                    Tarifa: +{formatUSD(settings.fullGuardDutyRate)} por día
                  </Text>
                </View>
              </View>
              <Switch
                value={isGuardiaCompleta}
                onValueChange={setIsGuardiaCompleta}
                trackColor={{ false: COLORS.surfaceLight, true: COLORS.guardiaCompletaDark }}
                thumbColor={isGuardiaCompleta ? COLORS.guardiaCompleta : '#cbd5e1'}
              />
            </View>

            {/* Opción 2: Horas extras */}
            <View style={styles.overtimeCard}>
              <View style={styles.optionInfo}>
                <View style={[styles.iconCircle, { backgroundColor: COLORS.overtimeBg }]}>
                  <MaterialCommunityIcons name="clock-time-four" size={22} color={COLORS.overtime} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{settings?.overtimeName || 'Horas Extras'}</Text>
                  <Text style={styles.optionSub}>
                    Tarifa: +{formatUSD(settings.overtimeRate)} por hora
                  </Text>
                </View>
              </View>

              {/* Controles de horas (solo enteros: -1h / +1h) */}
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleHourChange(-1)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="minus" size={18} color={COLORS.text} />
                  <Text style={styles.stepBtnText}>1 hora</Text>
                </TouchableOpacity>

                <View style={styles.hourInputContainer}>
                  <TextInput
                    style={styles.hourInput}
                    keyboardType="number-pad"
                    value={overtimeHours}
                    onChangeText={(text) => {
                      const clean = text.replace(/[^0-9]/g, '');
                      setOvertimeHours(clean === '' ? '0' : String(parseInt(clean, 10)));
                    }}
                    selectTextOnFocus
                  />
                  <Text style={styles.hourInputUnit}>hrs</Text>
                </View>

                <TouchableOpacity
                  style={styles.stepBtn}
                  onPress={() => handleHourChange(1)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={COLORS.text} />
                  <Text style={styles.stepBtnText}>1 hora</Text>
                </TouchableOpacity>
              </View>

              {/* Presets rápidos */}
              <View style={styles.presetsRow}>
                {[0, 1, 2, 4, 8].map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[
                      styles.presetChip,
                      numHours === h && styles.presetChipActive,
                    ]}
                    onPress={() => setPresetHours(h)}
                  >
                    <Text
                      style={[
                        styles.presetChipText,
                        numHours === h && styles.presetChipTextActive,
                      ]}
                    >
                      {h}h
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {numHours > 0 && (
                <Text style={styles.overtimeTotalHint}>
                  Subtotal extras: +{formatUSD(overtimePay)} ({numHours} hrs)
                </Text>
              )}
            </View>

            {/* Opción 3: Fin de semana (Solo habilitado en Sábado y Domingo) */}
            <View
              style={[
                styles.optionCard,
                isCalendarWeekend && isWeekend && styles.optionCardActiveWeekend,
                !isCalendarWeekend && styles.optionCardDisabled,
              ]}
            >
              <View style={styles.optionInfo}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: isCalendarWeekend
                        ? COLORS.weekendBg
                        : 'rgba(100, 116, 139, 0.15)',
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name="beach"
                    size={22}
                    color={isCalendarWeekend ? COLORS.weekend : COLORS.textMuted}
                  />
                </View>
                <View style={styles.optionTexts}>
                  <Text
                    style={[
                      styles.optionTitle,
                      !isCalendarWeekend && { color: COLORS.textMuted },
                    ]}
                  >
                    {settings?.weekendName || 'Pago por Fin de Semana'}
                  </Text>
                  {isCalendarWeekend ? (
                    <Text style={styles.optionSub}>
                      Tarifa: +{formatUSD(settings.weekendRate)} por {settings?.weekendName?.toLowerCase() || 'fin de semana'} ({fullDayName})
                    </Text>
                  ) : (
                    <Text style={styles.optionSubDisabled}>
                      🔒 Solo habilitado sábados y domingos ({fullDayName})
                    </Text>
                  )}
                </View>
              </View>
              <Switch
                value={isCalendarWeekend && isWeekend}
                onValueChange={(val) => {
                  if (isCalendarWeekend) setIsWeekend(val);
                }}
                disabled={!isCalendarWeekend}
                trackColor={{
                  false: COLORS.surfaceLight,
                  true: COLORS.weekendDark,
                }}
                thumbColor={isCalendarWeekend && isWeekend ? COLORS.weekend : '#64748B'}
              />
            </View>

            {/* Opción 4: Guardia Especial (Disponible cualquier día) */}
            <View style={[styles.specialGuardCard, isSpecialPay && styles.optionCardActiveSpecial]}>
              <View style={styles.optionCardRow}>
                <View style={styles.optionInfo}>
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.specialBg }]}>
                    <MaterialCommunityIcons name="star-circle" size={22} color={COLORS.special} />
                  </View>
                  <View style={styles.optionTexts}>
                    <Text style={styles.optionTitle}>{settings?.specialPayName || 'Guardia Especial'}</Text>
                    <Text style={styles.optionSub}>
                      {isSpecialPay
                        ? `Monto asignado: +${formatUSD(numSpecialPay)}`
                        : `Tarifa sugerida: +${formatUSD(settings.specialPayRate)}`}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={isSpecialPay}
                  onValueChange={(val) => {
                    setIsSpecialPay(val);
                    if (val && (!specialPayAmount || specialPayAmount === '0')) {
                      setSpecialPayAmount(String(settings.specialPayRate ?? 50));
                    }
                  }}
                  trackColor={{ false: COLORS.surfaceLight, true: COLORS.specialDark }}
                  thumbColor={isSpecialPay ? COLORS.special : '#cbd5e1'}
                />
              </View>

              {/* Pregunta y campo interactivo de monto cuando se activa la Guardia Especial */}
              {isSpecialPay && (
                <View style={styles.specialAmountPromptBox}>
                  <View style={styles.specialPromptHeader}>
                    <MaterialCommunityIcons name="help-circle-outline" size={16} color={COLORS.special} />
                    <Text style={styles.specialPromptQuestion}>
                      ¿Cuánto cobrarás por esta {settings?.specialPayName?.toLowerCase() || 'guardia especial'}?
                    </Text>
                  </View>

                  <View style={styles.specialAmountInputRow}>
                    <Text style={styles.specialAmountSymbol}>$</Text>
                    <TextInput
                      style={styles.specialAmountInput}
                      keyboardType="numeric"
                      value={specialPayAmount}
                      onChangeText={(val) => {
                        const clean = val.replace(/[^0-9.]/g, '');
                        setSpecialPayAmount(clean);
                      }}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textMuted}
                      selectTextOnFocus
                    />
                    <Text style={styles.specialAmountCurrency}>USD</Text>
                  </View>

                  {/* Chips rápidos de montos */}
                  <View style={styles.specialPresetsRow}>
                    {[30, 40, 50, 60, 80, 100].map((amt) => (
                      <TouchableOpacity
                        key={amt}
                        style={[
                          styles.specialPresetChip,
                          parseFloat(specialPayAmount) === amt && styles.specialPresetChipActive,
                        ]}
                        onPress={() => setSpecialPayAmount(String(amt))}
                      >
                        <Text
                          style={[
                            styles.specialPresetChipText,
                            parseFloat(specialPayAmount) === amt && styles.specialPresetChipTextActive,
                          ]}
                        >
                          ${amt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>

            {/* Notas opcionales */}
            <View style={styles.notesContainer}>
              <Text style={styles.notesLabel}>Notas / Comentarios (opcional):</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Ej. Turno de noche, guardia de soporte..."
                placeholderTextColor={COLORS.textMuted}
                value={notes}
                onChangeText={setNotes}
                maxLength={80}
              />
            </View>

            {/* Resumen adicional del día */}
            <View style={styles.daySummaryBox}>
              <Text style={styles.daySummaryLabel}>Total adicional de este día:</Text>
              <Text style={styles.daySummaryAmount}>+{formatUSD(totalDayExtra)}</Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={handleClear}
              activeOpacity={0.7}
            >
              <Text style={styles.clearBtnText}>Limpiar día</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  modalSheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '88%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sheetSubtitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.indigoLight,
    letterSpacing: 1,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
  },
  sheetBody: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  optionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  specialGuardCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  optionCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  specialAmountPromptBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 146, 60, 0.25)',
  },
  specialPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  specialPromptQuestion: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.special,
  },
  specialAmountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.special,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  specialAmountSymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.special,
    marginRight: 6,
  },
  specialAmountInput: {
    color: COLORS.special,
    fontSize: 20,
    fontWeight: '800',
    minWidth: 80,
    textAlign: 'center',
    paddingVertical: 6,
  },
  specialAmountCurrency: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  specialPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  specialPresetChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },
  specialPresetChipActive: {
    backgroundColor: COLORS.special,
    borderColor: COLORS.specialDark,
  },
  specialPresetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '700',
  },
  specialPresetChipTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  optionCardActiveGuardia: {
    borderColor: COLORS.guardia,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  optionCardActiveGuardiaCompleta: {
    borderColor: COLORS.guardiaCompleta,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  optionCardActiveWeekend: {
    borderColor: COLORS.weekend,
    backgroundColor: 'rgba(244, 114, 182, 0.08)',
  },
  optionCardActiveSpecial: {
    borderColor: COLORS.special,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
  },
  optionCardDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(51, 65, 85, 0.4)',
  },
  optionSubDisabled: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontStyle: 'italic',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionTexts: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  optionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calendarWeekendHint: {
    fontSize: 10,
    color: COLORS.weekend,
    marginTop: 3,
    fontWeight: '600',
  },
  overtimeCard: {
    backgroundColor: COLORS.surfaceCard,
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    gap: 8,
  },
  stepBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 4,
  },
  stepBtnText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
  },
  hourInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1.5,
    borderColor: COLORS.overtime,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    minWidth: 84,
    justifyContent: 'center',
  },
  hourInput: {
    color: COLORS.overtime,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 36,
  },
  hourInputUnit: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  presetChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  presetChipActive: {
    backgroundColor: COLORS.overtime,
  },
  presetChipText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  presetChipTextActive: {
    color: '#000000',
    fontWeight: '800',
  },
  overtimeTotalHint: {
    textAlign: 'center',
    color: COLORS.overtime,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: COLORS.surfaceCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
    fontSize: 13,
  },
  daySummaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
  },
  daySummaryLabel: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '700',
  },
  daySummaryAmount: {
    color: COLORS.primaryLight,
    fontSize: 15,
    fontWeight: '800',
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
  },
  clearBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clearBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  saveBtn: {
    flex: 2,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});
