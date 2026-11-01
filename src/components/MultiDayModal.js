import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { COLORS } from '../constants/theme';
import {
  MONTH_NAMES,
  isWeekendDay,
  formatUSD,
} from '../utils/calculator';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function MultiDayModal({
  visible,
  selectedDays = [],
  month,
  year,
  settings,
  onClose,
  onApply,
}) {
  // 'none' | 'regular' | 'completa' | 'especial'
  const [selectedGuardType, setSelectedGuardType] = useState('none');
  const [specialAmount, setSpecialAmount] = useState(String(settings?.specialPayRate ?? 50));
  const [includeWeekend, setIncludeWeekend] = useState(false);

  useEffect(() => {
    if (visible && selectedDays.length > 0) {
      const sorted = [...selectedDays].sort((a, b) => a - b);
      const wkCount = sorted.filter((d) => isWeekendDay(year, month, d)).length;
      const allAreWeekend = sorted.length > 0 && wkCount === sorted.length;

      // Si todos los días son fines de semana, por defecto no marcar ninguna guardia y marcar fin de semana
      if (allAreWeekend) {
        setSelectedGuardType('none');
        setIncludeWeekend(true);
      } else {
        setSelectedGuardType('none');
        setIncludeWeekend(wkCount > 0);
      }
      setSpecialAmount(String(settings?.specialPayRate ?? 50));
    }
  }, [visible, selectedDays, year, month, settings?.specialPayRate]);

  if (!visible || !selectedDays || selectedDays.length === 0) return null;

  const sortedDays = [...selectedDays].sort((a, b) => a - b);
  const weekendDaysCount = sortedDays.filter((d) => isWeekendDay(year, month, d)).length;

  const numDays = sortedDays.length;
  const regularRate = Number(settings?.guardDutyRate) || 0;
  const fullRate = Number(settings?.fullGuardDutyRate) || 0;
  const weekendRate = Number(settings?.weekendRate) || 0;
  const specialRate = parseFloat(specialAmount) || 0;

  // Toggle de guardia: si ya está seleccionada, la deselecciona (vuelve a 'none')
  const handleToggleGuard = (type) => {
    if (selectedGuardType === type) {
      setSelectedGuardType('none');
    } else {
      setSelectedGuardType(type);
    }
  };

  // Cálculo del extra proyectado
  let baseGuardExtra = 0;
  if (selectedGuardType === 'regular') baseGuardExtra = numDays * regularRate;
  if (selectedGuardType === 'completa') baseGuardExtra = numDays * fullRate;
  if (selectedGuardType === 'especial') baseGuardExtra = numDays * specialRate;

  const weekendExtra = includeWeekend ? weekendDaysCount * weekendRate : 0;
  const totalExtra = baseGuardExtra + weekendExtra;

  // Textos descriptivos para el resumen
  let summaryTitle = '';
  let summarySub = '';

  const guardName = settings?.guardDutyName || 'Guardia Regular';
  const fullGuardName = settings?.fullGuardDutyName || 'Guardia Completa';
  const specialName = settings?.specialPayName || 'Guardia Especial';
  const wkName = settings?.weekendName || 'Fin de Semana';

  let currentGuardLabel = '';
  if (selectedGuardType === 'regular') currentGuardLabel = guardName;
  if (selectedGuardType === 'completa') currentGuardLabel = fullGuardName;
  if (selectedGuardType === 'especial') currentGuardLabel = specialName;

  if (selectedGuardType === 'none' && includeWeekend && weekendDaysCount > 0) {
    summaryTitle = `Solo ${wkName} (${weekendDaysCount} d)`;
    summarySub = `Sin guardia + ${weekendDaysCount} ${wkName.toLowerCase()} (+${formatUSD(weekendExtra)})`;
  } else if (selectedGuardType !== 'none' && includeWeekend && weekendDaysCount > 0) {
    summaryTitle = `${currentGuardLabel} + ${wkName}`;
    summarySub = `${numDays} d ${currentGuardLabel} (+${formatUSD(baseGuardExtra)}) + ${weekendDaysCount} d ${wkName} (+${formatUSD(weekendExtra)})`;
  } else if (selectedGuardType !== 'none') {
    summaryTitle = `${currentGuardLabel} (${numDays} d)`;
    summarySub = `${numDays} d × ${currentGuardLabel} (+${formatUSD(baseGuardExtra)})`;
  } else {
    summaryTitle = `Sin Guardia ni ${wkName}`;
    summarySub = `Se desmarcarán las guardias y fines de semana de estos días`;
  }

  const handleApply = () => {
    onApply({
      guardType: selectedGuardType,
      specialPayAmount: selectedGuardType === 'especial' ? specialRate : undefined,
      isWeekend: includeWeekend,
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
            <View style={{ flex: 1 }}>
              <Text style={styles.sheetSubtitle}>SELECCIÓN MÚLTIPLE ({numDays} DÍAS)</Text>
              <Text style={styles.sheetTitle}>
                Configurar Lote de Días
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.sheetBody} showsVerticalScrollIndicator={false}>
            {/* Días seleccionados chips */}
            <View style={styles.daysChipContainer}>
              <Text style={styles.sectionLabel}>Días seleccionados ({MONTH_NAMES[month]} {year}):</Text>
              <View style={styles.chipsScroll}>
                {sortedDays.map((d) => {
                  const isWk = isWeekendDay(year, month, d);
                  return (
                    <View
                      key={d}
                      style={[
                        styles.dayChip,
                        isWk && { borderColor: COLORS.weekend, backgroundColor: 'rgba(244, 114, 182, 0.12)' },
                      ]}
                    >
                      <Text style={[styles.dayChipText, isWk && { color: COLORS.weekend }]}>
                        {isWk ? `Día ${d} (Finde)` : `Día ${d}`}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Aviso informativo */}
            <View style={styles.infoBanner}>
              <MaterialCommunityIcons name="information-outline" size={16} color={COLORS.indigoLight} />
              <Text style={styles.infoBannerText}>
                Puedes seleccionar un tipo de guardia, marcar solo fin de semana, o combinar ambas opciones.
              </Text>
            </View>

            {/* 1. SECCIÓN FIN DE SEMANA (si hay días que caigan sábado/domingo) */}
            {weekendDaysCount > 0 && (
              <View style={styles.weekendSection}>
                <Text style={styles.sectionTitle}>Fin de Semana:</Text>
                <TouchableOpacity
                  style={[
                    styles.weekendOptionCard,
                    includeWeekend && styles.weekendOptionCardActive,
                  ]}
                  onPress={() => setIncludeWeekend(!includeWeekend)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.weekendBg }]}>
                    <MaterialCommunityIcons name="beach" size={22} color={COLORS.weekend} />
                  </View>
                  <View style={styles.optionTexts}>
                    <Text style={styles.optionTitle}>{settings?.weekendName || 'Pago por Fin de Semana'}</Text>
                    <Text style={styles.optionSub}>
                      +{formatUSD(weekendRate)} por día ({weekendDaysCount} día(s) sábado o domingo)
                    </Text>
                  </View>
                  <MaterialCommunityIcons
                    name={includeWeekend ? 'checkbox-marked' : 'checkbox-blank-outline'}
                    size={26}
                    color={includeWeekend ? COLORS.weekend : COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* 2. SECCIÓN TIPO DE GUARDIA */}
            <View style={{ marginTop: 4 }}>
              <View style={styles.guardSectionHeader}>
                <Text style={styles.sectionTitle}>Tipo de Guardia (Opcional):</Text>
                {selectedGuardType !== 'none' && (
                  <TouchableOpacity onPress={() => setSelectedGuardType('none')}>
                    <Text style={styles.clearGuardText}>Quitar guardia</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Opción A: Sin Guardia */}
              <TouchableOpacity
                style={[
                  styles.typeOptionCard,
                  selectedGuardType === 'none' && styles.typeOptionActiveNone,
                ]}
                onPress={() => setSelectedGuardType('none')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: 'rgba(100, 116, 139, 0.2)' }]}>
                  <MaterialCommunityIcons name="shield-off-outline" size={20} color={COLORS.textSecondary} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>Sin Guardia</Text>
                  <Text style={styles.optionSub}>No asignar ninguna guardia a estos días</Text>
                </View>
                <View style={styles.radioOuter}>
                  {selectedGuardType === 'none' && <View style={[styles.radioInner, { backgroundColor: COLORS.primaryLight }]} />}
                </View>
              </TouchableOpacity>

              {/* Opción B: Guardia Regular */}
              <TouchableOpacity
                style={[
                  styles.typeOptionCard,
                  selectedGuardType === 'regular' && styles.typeOptionActiveRegular,
                ]}
                onPress={() => handleToggleGuard('regular')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: COLORS.guardiaBg }]}>
                  <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.guardia} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{settings?.guardDutyName || 'Guardia Regular'}</Text>
                  <Text style={styles.optionSub}>+{formatUSD(regularRate)} por día</Text>
                </View>
                <View style={styles.radioOuter}>
                  {selectedGuardType === 'regular' && <View style={[styles.radioInner, { backgroundColor: COLORS.guardia }]} />}
                </View>
              </TouchableOpacity>

              {/* Opción C: Guardia Completa */}
              <TouchableOpacity
                style={[
                  styles.typeOptionCard,
                  selectedGuardType === 'completa' && styles.typeOptionActiveCompleta,
                ]}
                onPress={() => handleToggleGuard('completa')}
                activeOpacity={0.8}
              >
                <View style={[styles.iconCircle, { backgroundColor: COLORS.guardiaCompletaBg }]}>
                  <MaterialCommunityIcons name="shield-star" size={22} color={COLORS.guardiaCompleta} />
                </View>
                <View style={styles.optionTexts}>
                  <Text style={styles.optionTitle}>{settings?.fullGuardDutyName || 'Guardia Completa'}</Text>
                  <Text style={styles.optionSub}>+{formatUSD(fullRate)} por día</Text>
                </View>
                <View style={styles.radioOuter}>
                  {selectedGuardType === 'completa' && <View style={[styles.radioInner, { backgroundColor: COLORS.guardiaCompleta }]} />}
                </View>
              </TouchableOpacity>

              {/* Opción D: Guardia Especial (con pregunta interactiva) */}
              <View
                style={[
                  styles.specialCardContainer,
                  selectedGuardType === 'especial' && styles.typeOptionActiveSpecial,
                ]}
              >
                <TouchableOpacity
                  style={styles.typeOptionCardInner}
                  onPress={() => handleToggleGuard('especial')}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconCircle, { backgroundColor: COLORS.specialBg }]}>
                    <MaterialCommunityIcons name="star-circle" size={22} color={COLORS.special} />
                  </View>
                  <View style={styles.optionTexts}>
                    <Text style={styles.optionTitle}>{settings?.specialPayName || 'Guardia Especial'}</Text>
                    <Text style={styles.optionSub}>
                      {selectedGuardType === 'especial'
                        ? `Monto asignado: +${formatUSD(specialRate)} por día`
                        : 'Monto personalizable'}
                    </Text>
                  </View>
                  <View style={styles.radioOuter}>
                    {selectedGuardType === 'especial' && <View style={[styles.radioInner, { backgroundColor: COLORS.special }]} />}
                  </View>
                </TouchableOpacity>

                {/* Pregunta interactiva del monto para Guardia Especial */}
                {selectedGuardType === 'especial' && (
                  <View style={styles.specialAmountPromptBox}>
                    <View style={styles.specialPromptHeader}>
                      <MaterialCommunityIcons name="help-circle-outline" size={16} color={COLORS.special} />
                      <Text style={styles.specialPromptQuestion}>
                        ¿Cuánto se pagará por día en esta {settings?.specialPayName || 'Guardia Especial'}?
                      </Text>
                    </View>

                    <View style={styles.specialAmountInputRow}>
                      <Text style={styles.specialAmountSymbol}>$</Text>
                      <TextInput
                        style={styles.specialAmountInput}
                        keyboardType="decimal-pad"
                        value={specialAmount}
                        onChangeText={(val) => {
                          const clean = val.replace(/[^0-9.]/g, '');
                          setSpecialAmount(clean);
                        }}
                        placeholder="0.00"
                        placeholderTextColor={COLORS.textMuted}
                        selectTextOnFocus
                      />
                      <Text style={styles.specialAmountCurrency}>USD / día</Text>
                    </View>

                    {/* Chips rápidos */}
                    <View style={styles.specialPresetsRow}>
                      {[30, 40, 50, 60, 80, 100].map((amt) => (
                        <TouchableOpacity
                          key={amt}
                          style={[
                            styles.specialPresetChip,
                            parseFloat(specialAmount) === amt && styles.specialPresetChipActive,
                          ]}
                          onPress={() => setSpecialAmount(String(amt))}
                        >
                          <Text
                            style={[
                              styles.specialPresetChipText,
                              parseFloat(specialAmount) === amt && styles.specialPresetChipTextActive,
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
            </View>

            {/* Resumen adicional proyectado */}
            <View style={styles.summaryBox}>
              <View style={{ flex: 1 }}>
                <Text style={styles.summaryLabel}>{summaryTitle}</Text>
                <Text style={styles.summarySub}>{summarySub}</Text>
              </View>
              <Text style={styles.summaryAmount}>
                {totalExtra > 0 ? `+${formatUSD(totalExtra)}` : '$0.00'}
              </Text>
            </View>
          </ScrollView>

          {/* Footer Buttons */}
          <View style={styles.sheetFooter}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.applyBtn}
              onPress={handleApply}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons name="check-all" size={20} color="#0F172A" />
              <Text style={styles.applyBtnText}>
                Aplicar a {numDays} días
              </Text>
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
    maxHeight: '90%',
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
    paddingTop: 12,
  },
  daysChipContainer: {
    marginBottom: 10,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  chipsScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dayChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dayChipText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.indigoLight,
    fontWeight: '500',
    lineHeight: 15,
  },
  weekendSection: {
    marginBottom: 12,
  },
  guardSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clearGuardText: {
    fontSize: 11,
    color: COLORS.danger,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  typeOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  specialCardContainer: {
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeOptionActiveRegular: {
    borderColor: COLORS.guardia,
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  typeOptionActiveCompleta: {
    borderColor: COLORS.guardiaCompleta,
    backgroundColor: 'rgba(168, 85, 247, 0.08)',
  },
  typeOptionActiveSpecial: {
    borderColor: COLORS.special,
    backgroundColor: 'rgba(251, 146, 60, 0.08)',
  },
  typeOptionActiveNone: {
    borderColor: COLORS.primaryLight,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  specialAmountPromptBox: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(251, 146, 60, 0.25)',
  },
  specialPromptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
  },
  specialAmountSymbol: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.special,
    marginRight: 6,
  },
  specialAmountInput: {
    color: COLORS.special,
    fontSize: 18,
    fontWeight: '800',
    minWidth: 70,
    textAlign: 'center',
    paddingVertical: 4,
  },
  specialAmountCurrency: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  specialPresetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  specialPresetChip: {
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
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
  weekendOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceCard,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  weekendOptionCardActive: {
    borderColor: COLORS.weekend,
    backgroundColor: 'rgba(244, 114, 182, 0.1)',
  },
  summaryBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primaryBg,
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginVertical: 10,
    gap: 10,
  },
  summaryLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },
  summarySub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  summaryAmount: {
    color: COLORS.primaryLight,
    fontSize: 18,
    fontWeight: '900',
  },
  sheetFooter: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: COLORS.surfaceLight,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: {
    color: COLORS.textSecondary,
    fontWeight: '700',
    fontSize: 13,
  },
  applyBtn: {
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
  applyBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
});
