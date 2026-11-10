import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { COLORS, DEFAULT_SETTINGS } from '../constants/theme';
import { APP_VERSION, DEFAULT_GITHUB_REPO } from '../constants/version';
import {
  checkForAppUpdates,
  downloadAndInstallApkDirectly,
} from '../services/updateService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function SettingsScreen({
  settings,
  bcvData,
  bcvLoading,
  onRefreshBcv,
  onSaveManualBcv,
  onSaveSettings,
}) {
  const [baseSalary, setBaseSalary] = useState(String(settings.baseSalary ?? 1200));
  const [firstCutPercent, setFirstCutPercent] = useState(String(settings.firstCutPercent ?? 50));
  const [overtimeRate, setOvertimeRate] = useState(String(settings.overtimeRate ?? 15));
  const [guardDutyRate, setGuardDutyRate] = useState(String(settings.guardDutyRate ?? 50));
  const [fullGuardDutyRate, setFullGuardDutyRate] = useState(String(settings.fullGuardDutyRate ?? 80));
  const [weekendRate, setWeekendRate] = useState(String(settings.weekendRate ?? 40));
  const [manualBcvRate, setManualBcvRate] = useState(String(bcvData?.rate ?? 887.30));

  // Nombres editables de las guardias
  const [guardDutyName, setGuardDutyName] = useState(settings.guardDutyName || DEFAULT_SETTINGS.guardDutyName || 'Guardia Regular');
  const [fullGuardDutyName, setFullGuardDutyName] = useState(settings.fullGuardDutyName || DEFAULT_SETTINGS.fullGuardDutyName || 'Guardia Completa');
  const [specialPayName, setSpecialPayName] = useState(settings.specialPayName || DEFAULT_SETTINGS.specialPayName || 'Guardia Especial');
  const [overtimeName, setOvertimeName] = useState(settings.overtimeName || DEFAULT_SETTINGS.overtimeName || 'Horas Extras');
  const [weekendName, setWeekendName] = useState(settings.weekendName || DEFAULT_SETTINGS.weekendName || 'Fin de Semana');
  const [githubRepo, setGithubRepo] = useState(settings.githubRepo || DEFAULT_SETTINGS.githubRepo || DEFAULT_GITHUB_REPO);

  // Actualizador
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);

  // Modal para editar nombre con lápiz
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({ key: '', title: '', defaultVal: '', color: '#10B981' });
  const [modalTempName, setModalTempName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (bcvData?.rate) {
      setManualBcvRate(String(bcvData.rate));
    }
  }, [bcvData]);

  const handleOpenEditModal = (key, currentVal, defaultVal, title, color) => {
    setModalConfig({ key, title, defaultVal, color });
    setModalTempName(currentVal || defaultVal);
    setEditModalVisible(true);
  };

  const handleApplyModalName = () => {
    const trimmed = modalTempName.trim() || modalConfig.defaultVal;
    if (modalConfig.key === 'guardDutyName') setGuardDutyName(trimmed);
    if (modalConfig.key === 'fullGuardDutyName') setFullGuardDutyName(trimmed);
    if (modalConfig.key === 'specialPayName') setSpecialPayName(trimmed);
    if (modalConfig.key === 'overtimeName') setOvertimeName(trimmed);
    if (modalConfig.key === 'weekendName') setWeekendName(trimmed);

    setEditModalVisible(false);
  };

  const handleSave = () => {
    const rawPct = parseFloat(String(firstCutPercent).replace(',', '.')) || 0;
    const parsedPercent = Math.min(100, Math.max(0, parseFloat(rawPct.toFixed(2))));
    const updated = {
      baseSalary: Math.max(0, parseFloat(baseSalary) || 0),
      firstCutPercent: parsedPercent,
      overtimeRate: Math.max(0, parseFloat(overtimeRate) || 0),
      guardDutyRate: Math.max(0, parseFloat(guardDutyRate) || 0),
      fullGuardDutyRate: Math.max(0, parseFloat(fullGuardDutyRate) || 0),
      weekendRate: Math.max(0, parseFloat(weekendRate) || 0),
      specialPayRate: 'ask', // Siempre preguntar por el monto en cada guardia especial
      guardDutyName: guardDutyName.trim() || DEFAULT_SETTINGS.guardDutyName,
      fullGuardDutyName: fullGuardDutyName.trim() || DEFAULT_SETTINGS.fullGuardDutyName,
      specialPayName: specialPayName.trim() || DEFAULT_SETTINGS.specialPayName,
      overtimeName: overtimeName.trim() || DEFAULT_SETTINGS.overtimeName,
      weekendName: weekendName.trim() || DEFAULT_SETTINGS.weekendName,
      githubRepo: githubRepo.trim() || DEFAULT_SETTINGS.githubRepo || DEFAULT_GITHUB_REPO,
    };

    onSaveSettings(updated);
    if (onSaveManualBcv && manualBcvRate) {
      onSaveManualBcv(manualBcvRate);
    }
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const result = await checkForAppUpdates(githubRepo);
      if (!result.success) {
        setUpdateStatus({ type: 'error', message: result.error || 'Error al conectar con GitHub.' });
      } else if (result.hasUpdate) {
        setUpdateData(result);
        setUpdateModalVisible(true);
        setUpdateStatus({ type: 'available', message: `¡Nueva versión v${result.latestVersion} disponible!` });
      } else {
        setUpdateStatus({ type: 'success', message: `¡Tu aplicación está al día! (v${result.currentVersion})` });
      }
    } catch (err) {
      setUpdateStatus({ type: 'error', message: 'Error al comprobar actualizaciones.' });
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleDirectUpdate = async () => {
    if (!updateData?.downloadUrl) return;
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadError(null);

    try {
      await downloadAndInstallApkDirectly(updateData.downloadUrl, (event) => {
        if (event && typeof event.percent === 'number' && event.percent >= 0) {
          setDownloadProgress(event.percent);
        }
      });
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      setDownloadError(error?.message || 'Error al descargar o iniciar instalación.');
    }
  };

  const day15Percent = parseFloat(Math.max(0, 100 - (parseFloat(String(firstCutPercent).replace(',', '.')) || 0)).toFixed(1));

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configura tu sueldo y tarifas</Text>
        </View>

        {savedSuccess && (
          <View style={styles.successPill}>
            <Text style={styles.successPillText}>✓ ¡Cambios guardados con éxito!</Text>
          </View>
        )}

        {/* 1. Sueldo Base Mensual y Porcentaje del Día 1 */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>💰 TU SUELDO BASE MENSUAL</Text>

          <View style={styles.salaryInputRow}>
            <Text style={styles.dollarSign}>$</Text>
            <TextInput
              style={styles.salaryInput}
              keyboardType="numeric"
              value={baseSalary}
              onChangeText={setBaseSalary}
              placeholder="1200"
              placeholderTextColor="#64748B"
            />
            <Text style={styles.monthUnit}>/ mes</Text>
          </View>

          {/* Campo editable de Porcentaje del Día 1 */}
          <Text style={styles.quincenaLabel}>% del Sueldo Base a cobrar el 1ro de cada mes:</Text>
          <View style={styles.percentInputRow}>
            <TextInput
              style={styles.percentInput}
              keyboardType="decimal-pad"
              value={firstCutPercent}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9.,]/g, '');
                setFirstCutPercent(clean);
              }}
              placeholder="50"
              placeholderTextColor="#64748B"
              maxLength={5}
            />
            <Text style={styles.percentSymbol}>%</Text>
            <Text style={styles.percentSubText}>
              (El día 15 cobrará el {day15Percent}% restante)
            </Text>
          </View>

          {/* Chips de selección rápida */}
          <View style={styles.chipsRow}>
            {[
              { label: '50% / 50%', val: '50' },
              { label: '60% / 40%', val: '60' },
              { label: '70% / 30%', val: '70' },
            ].map((c) => (
              <TouchableOpacity
                key={c.val}
                style={[
                  styles.chipBtn,
                  firstCutPercent === c.val && styles.chipBtnActive,
                ]}
                onPress={() => setFirstCutPercent(c.val)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.chipText,
                    firstCutPercent === c.val && styles.chipTextActive,
                  ]}
                >
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Tarifas por Guardia (Con Lapicito para editar nombres) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🛡️ TARIFAS DE GUARDIAS Y HORAS EXTRAS</Text>

          {/* Tarifa 1: Regular */}
          <View style={styles.rateRow}>
            <View style={styles.rateNameCol}>
              <TouchableOpacity
                style={styles.nameWithPencil}
                onPress={() =>
                  handleOpenEditModal(
                    'guardDutyName',
                    guardDutyName,
                    DEFAULT_SETTINGS.guardDutyName,
                    'Guardia Regular',
                    '#38BDF8'
                  )
                }
              >
                <Text style={styles.rateNameText} numberOfLines={1}>
                  🛡️ {guardDutyName}
                </Text>
                <MaterialCommunityIcons name="pencil" size={14} color="#38BDF8" />
              </TouchableOpacity>
              <Text style={styles.rateSubText}>Por día trabajado</Text>
            </View>

            <View style={styles.rateInputBox}>
              <Text style={styles.rateCurrency}>$</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={guardDutyRate}
                onChangeText={setGuardDutyRate}
                placeholder="50"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Tarifa 2: Completa */}
          <View style={styles.rateRow}>
            <View style={styles.rateNameCol}>
              <TouchableOpacity
                style={styles.nameWithPencil}
                onPress={() =>
                  handleOpenEditModal(
                    'fullGuardDutyName',
                    fullGuardDutyName,
                    DEFAULT_SETTINGS.fullGuardDutyName,
                    'Guardia Completa',
                    '#A855F7'
                  )
                }
              >
                <Text style={styles.rateNameText} numberOfLines={1}>
                  ⭐ {fullGuardDutyName}
                </Text>
                <MaterialCommunityIcons name="pencil" size={14} color="#A855F7" />
              </TouchableOpacity>
              <Text style={styles.rateSubText}>Por día completo</Text>
            </View>

            <View style={styles.rateInputBox}>
              <Text style={styles.rateCurrency}>$</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={fullGuardDutyRate}
                onChangeText={setFullGuardDutyRate}
                placeholder="80"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Tarifa 3: Fin de Semana */}
          <View style={styles.rateRow}>
            <View style={styles.rateNameCol}>
              <TouchableOpacity
                style={styles.nameWithPencil}
                onPress={() =>
                  handleOpenEditModal(
                    'weekendName',
                    weekendName,
                    DEFAULT_SETTINGS.weekendName,
                    'Fin de Semana',
                    '#F472B6'
                  )
                }
              >
                <Text style={styles.rateNameText} numberOfLines={1}>
                  🏖️ {weekendName}
                </Text>
                <MaterialCommunityIcons name="pencil" size={14} color="#F472B6" />
              </TouchableOpacity>
              <Text style={styles.rateSubText}>Sábados y Domingos</Text>
            </View>

            <View style={styles.rateInputBox}>
              <Text style={styles.rateCurrency}>$</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={weekendRate}
                onChangeText={setWeekendRate}
                placeholder="40"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Tarifa 4: Horas Extras */}
          <View style={styles.rateRow}>
            <View style={styles.rateNameCol}>
              <TouchableOpacity
                style={styles.nameWithPencil}
                onPress={() =>
                  handleOpenEditModal(
                    'overtimeName',
                    overtimeName,
                    DEFAULT_SETTINGS.overtimeName,
                    'Horas Extras',
                    '#FBBF24'
                  )
                }
              >
                <Text style={styles.rateNameText} numberOfLines={1}>
                  ⏱️ {overtimeName}
                </Text>
                <MaterialCommunityIcons name="pencil" size={14} color="#FBBF24" />
              </TouchableOpacity>
              <Text style={styles.rateSubText}>Por cada hora adicional</Text>
            </View>

            <View style={styles.rateInputBox}>
              <Text style={styles.rateCurrency}>$</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={overtimeRate}
                onChangeText={setOvertimeRate}
                placeholder="15"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Tarifa 5: Guardia Especial ("Siempre preguntar", sin input) */}
          <View style={[styles.rateRow, { borderBottomWidth: 0 }]}>
            <View style={styles.rateNameCol}>
              <TouchableOpacity
                style={styles.nameWithPencil}
                onPress={() =>
                  handleOpenEditModal(
                    'specialPayName',
                    specialPayName,
                    DEFAULT_SETTINGS.specialPayName,
                    'Guardia Especial',
                    '#FB923C'
                  )
                }
              >
                <Text style={styles.rateNameText} numberOfLines={1}>
                  ✨ {specialPayName}
                </Text>
                <MaterialCommunityIcons name="pencil" size={14} color="#FB923C" />
              </TouchableOpacity>
              <Text style={styles.rateSubText}>Monto variable por cada turno</Text>
            </View>

            <View style={styles.alwaysAskPill}>
              <MaterialCommunityIcons name="help-circle-outline" size={14} color="#FB923C" />
              <Text style={styles.alwaysAskText}>Siempre preguntar</Text>
            </View>
          </View>
        </View>

        {/* 3. Dólar Oficial BCV */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>🇻🇪 TASA DEL DÓLAR (BCV)</Text>

          <View style={styles.bcvRow}>
            <View style={styles.bcvInputContainer}>
              <Text style={styles.bcvBsPrefix}>Bs.</Text>
              <TextInput
                style={styles.bcvInput}
                keyboardType="numeric"
                value={manualBcvRate}
                onChangeText={setManualBcvRate}
                placeholder="887.30"
                placeholderTextColor="#64748B"
              />
            </View>

            <TouchableOpacity
              style={styles.refreshBcvBtn}
              onPress={onRefreshBcv}
              disabled={bcvLoading}
              activeOpacity={0.7}
            >
              {bcvLoading ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Text style={styles.refreshBcvText}>🔄 Actualizar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Botón Grande de Guardar */}
        <TouchableOpacity
          style={styles.saveBigBtn}
          onPress={handleSave}
          activeOpacity={0.8}
        >
          <Text style={styles.saveBigBtnText}>💾 Guardar Cambios</Text>
        </TouchableOpacity>

        {/* 5. Actualizador In-App */}
        <View style={styles.updateCard}>
          <View style={styles.updateHeader}>
            <Text style={styles.updateTitle}>ACTUALIZACIONES</Text>
            <Text style={styles.versionBadge}>v{APP_VERSION}</Text>
          </View>

          <TouchableOpacity
            style={styles.updateCheckBtn}
            onPress={handleCheckUpdates}
            disabled={checkingUpdate}
            activeOpacity={0.8}
          >
            {checkingUpdate ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.updateCheckBtnText}>🔍 Buscar Nueva Versión</Text>
            )}
          </TouchableOpacity>

          {updateStatus && (
            <Text
              style={[
                styles.updateStatusText,
                updateStatus.type === 'available' && { color: '#34D399' },
                updateStatus.type === 'error' && { color: '#EF4444' },
              ]}
            >
              {updateStatus.message}
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Modal para editar nombres con el lápiz */}
      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Editar nombre de la guardia</Text>
            <TextInput
              style={styles.modalInput}
              value={modalTempName}
              onChangeText={setModalTempName}
              placeholder="Escribe el nombre aquí..."
              placeholderTextColor="#64748B"
              autoFocus
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleApplyModalName}
              >
                <Text style={styles.modalSaveText}>Aceptar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal para descargar nueva versión */}
      <Modal visible={updateModalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¡Nueva versión disponible!</Text>
            <Text style={styles.modalSub}>
              Versión {updateData?.latestVersion} lista para instalar.
            </Text>

            {isDownloading ? (
              <View style={styles.progressBox}>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.progressText}>
                  Descargando actualización... ({downloadProgress}%)
                </Text>
              </View>
            ) : (
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setUpdateModalVisible(false)}
                >
                  <Text style={styles.modalCancelText}>Ahora no</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalSaveBtn}
                  onPress={handleDirectUpdate}
                >
                  <Text style={styles.modalSaveText}>Instalar ahora</Text>
                </TouchableOpacity>
              </View>
            )}

            {downloadError && (
              <Text style={styles.downloadErrorText}>{downloadError}</Text>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#090D16',
  },
  scrollContent: {
    paddingBottom: 36,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
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
  successPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
    marginHorizontal: 16,
    marginVertical: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  successPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  sectionCard: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  salaryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dollarSign: {
    fontSize: 20,
    fontWeight: '900',
    color: '#10B981',
    marginRight: 6,
  },
  salaryInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  monthUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '700',
  },
  quincenaLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
  },
  percentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    marginBottom: 10,
  },
  percentInput: {
    fontSize: 18,
    fontWeight: '900',
    color: '#818CF8',
    minWidth: 44,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '900',
    color: '#818CF8',
    marginRight: 8,
  },
  percentSubText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    flex: 1,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chipBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipBtnActive: {
    backgroundColor: '#6366F1',
    borderColor: '#818CF8',
  },
  chipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  rateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  rateNameCol: {
    flex: 1,
  },
  nameWithPencil: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rateNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rateSubText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  rateInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minWidth: 74,
  },
  rateCurrency: {
    fontSize: 14,
    fontWeight: '900',
    color: '#10B981',
    marginRight: 4,
  },
  rateInput: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    minWidth: 40,
  },
  alwaysAskPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 146, 60, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251, 146, 60, 0.35)',
    gap: 4,
  },
  alwaysAskText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB923C',
  },
  bcvRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  bcvInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bcvBsPrefix: {
    fontSize: 14,
    fontWeight: '800',
    color: '#94A3B8',
    marginRight: 6,
  },
  bcvInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  refreshBcvBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  refreshBcvText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34D399',
  },
  saveBigBtn: {
    backgroundColor: '#10B981',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 3,
  },
  saveBigBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#090D16',
  },
  updateCard: {
    backgroundColor: '#111827',
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  versionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#818CF8',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  updateCheckBtn: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  updateCheckBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  updateStatusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginTop: 8,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalSub: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94A3B8',
  },
  modalSaveBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  modalSaveText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#090D16',
  },
  progressBox: {
    alignItems: 'center',
    paddingVertical: 14,
    gap: 10,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34D399',
  },
  downloadErrorText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 8,
    textAlign: 'center',
  },
});
