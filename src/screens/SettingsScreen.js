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
import { formatUSD, formatVES } from '../utils/calculator';
import { APP_VERSION, DEFAULT_GITHUB_REPO } from '../constants/version';
import {
  checkForAppUpdates,
  downloadAndInstallApkDirectly,
  openUpdateDownloadUrl,
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
  const [specialPayRate, setSpecialPayRate] = useState(String(settings.specialPayRate ?? 50));
  const [manualBcvRate, setManualBcvRate] = useState(String(bcvData?.rate ?? 887.30));

  // Nombres editables de las guardias y conceptos extras
  const [guardDutyName, setGuardDutyName] = useState(settings.guardDutyName || DEFAULT_SETTINGS.guardDutyName || 'Guardia Regular');
  const [fullGuardDutyName, setFullGuardDutyName] = useState(settings.fullGuardDutyName || DEFAULT_SETTINGS.fullGuardDutyName || 'Guardia Completa');
  const [specialPayName, setSpecialPayName] = useState(settings.specialPayName || DEFAULT_SETTINGS.specialPayName || 'Guardia Especial');
  const [overtimeName, setOvertimeName] = useState(settings.overtimeName || DEFAULT_SETTINGS.overtimeName || 'Horas Extras');
  const [weekendName, setWeekendName] = useState(settings.weekendName || DEFAULT_SETTINGS.weekendName || 'Fin de Semana');

  // Repositorio GitHub y control de actualizaciones
  const [githubRepo, setGithubRepo] = useState(settings.githubRepo || DEFAULT_SETTINGS.githubRepo || DEFAULT_GITHUB_REPO);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null); // { type: 'success' | 'available' | 'info' | 'error', message: string }
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updateData, setUpdateData] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);

  // Modal para editar nombre con lápiz
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    key: '',
    title: '',
    defaultVal: '',
    color: COLORS.primary,
    suggestions: [],
  });
  const [modalTempName, setModalTempName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (bcvData?.rate) {
      setManualBcvRate(String(bcvData.rate));
    }
  }, [bcvData]);

  // Abrir modal de edición de nombre
  const handleOpenEditModal = (key, currentVal, defaultVal, title, color, suggestions) => {
    setModalConfig({
      key,
      title,
      defaultVal,
      color,
      suggestions: suggestions || [],
    });
    setModalTempName(currentVal || defaultVal);
    setEditModalVisible(true);
  };

  // Guardar nombre desde el modal
  const handleApplyModalName = () => {
    const trimmed = modalTempName.trim() || modalConfig.defaultVal;
    if (modalConfig.key === 'guardDutyName') setGuardDutyName(trimmed);
    if (modalConfig.key === 'fullGuardDutyName') setFullGuardDutyName(trimmed);
    if (modalConfig.key === 'specialPayName') setSpecialPayName(trimmed);
    if (modalConfig.key === 'overtimeName') setOvertimeName(trimmed);
    if (modalConfig.key === 'weekendName') setWeekendName(trimmed);
    if (modalConfig.key === 'githubRepo') setGithubRepo(trimmed);

    // Auto-actualizar y persistir la configuración completa
    const rawPct = parseFloat(String(firstCutPercent).replace(',', '.')) || 0;
    const parsedPercent = Math.min(100, Math.max(0, parseFloat(rawPct.toFixed(2))));
    const updated = {
      baseSalary: Math.max(0, parseFloat(baseSalary) || 0),
      firstCutPercent: parsedPercent,
      overtimeRate: Math.max(0, parseFloat(overtimeRate) || 0),
      guardDutyRate: Math.max(0, parseFloat(guardDutyRate) || 0),
      fullGuardDutyRate: Math.max(0, parseFloat(fullGuardDutyRate) || 0),
      weekendRate: Math.max(0, parseFloat(weekendRate) || 0),
      specialPayRate: Math.max(0, parseFloat(specialPayRate) || 0),
      guardDutyName: modalConfig.key === 'guardDutyName' ? trimmed : guardDutyName,
      fullGuardDutyName: modalConfig.key === 'fullGuardDutyName' ? trimmed : fullGuardDutyName,
      specialPayName: modalConfig.key === 'specialPayName' ? trimmed : specialPayName,
      overtimeName: modalConfig.key === 'overtimeName' ? trimmed : overtimeName,
      weekendName: modalConfig.key === 'weekendName' ? trimmed : weekendName,
      githubRepo: modalConfig.key === 'githubRepo' ? trimmed : githubRepo,
    };

    onSaveSettings(updated);
    setEditModalVisible(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateStatus(null);
    try {
      const result = await checkForAppUpdates(githubRepo);
      if (!result.success) {
        setUpdateStatus({
          type: 'error',
          message: result.error || 'Error al conectar con GitHub.',
        });
      } else if (result.hasUpdate) {
        setUpdateData(result);
        setUpdateModalVisible(true);
        setUpdateStatus({
          type: 'available',
          message: `¡Nueva versión v${result.latestVersion} disponible! Pulsa para descargar.`,
        });
      } else if (result.noReleases) {
        setUpdateStatus({
          type: 'info',
          message: `Aún no hay versiones publicadas en ${githubRepo}. Al publicar tu primer release en GitHub aparecerá aquí.`,
        });
      } else {
        setUpdateStatus({
          type: 'success',
          message: `¡Ya tienes la versión más reciente (v${result.currentVersion})!`,
        });
      }
    } catch (err) {
      setUpdateStatus({
        type: 'error',
        message: 'Ocurrió un error inesperado al comprobar actualizaciones.',
      });
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
      // La descarga finalizó y el instalador de Android fue lanzado
      setIsDownloading(false);
    } catch (error) {
      setIsDownloading(false);
      const msg = error?.message || 'Error al descargar o iniciar la instalación.';
      setDownloadError(msg);
    }
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
      specialPayRate: Math.max(0, parseFloat(specialPayRate) || 0),
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
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    Alert.alert(
      'Restablecer valores',
      '¿Deseas restaurar las tarifas, nombres y salario a los valores por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Restablecer',
          onPress: () => {
            setBaseSalary(String(DEFAULT_SETTINGS.baseSalary));
            setFirstCutPercent(String(DEFAULT_SETTINGS.firstCutPercent ?? 50));
            setOvertimeRate(String(DEFAULT_SETTINGS.overtimeRate));
            setGuardDutyRate(String(DEFAULT_SETTINGS.guardDutyRate));
            setFullGuardDutyRate(String(DEFAULT_SETTINGS.fullGuardDutyRate));
            setWeekendRate(String(DEFAULT_SETTINGS.weekendRate));
            setSpecialPayRate(String(DEFAULT_SETTINGS.specialPayRate));
            setGuardDutyName(DEFAULT_SETTINGS.guardDutyName);
            setFullGuardDutyName(DEFAULT_SETTINGS.fullGuardDutyName);
            setSpecialPayName(DEFAULT_SETTINGS.specialPayName);
            setOvertimeName(DEFAULT_SETTINGS.overtimeName);
            setWeekendName(DEFAULT_SETTINGS.weekendName);
            setGithubRepo(DEFAULT_SETTINGS.githubRepo || DEFAULT_GITHUB_REPO);
            onSaveSettings(DEFAULT_SETTINGS);
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Configuración Salarial</Text>
          <Text style={styles.subtitle}>
            Ajusta tu salario base y las tarifas en dólares (USD $)
          </Text>
        </View>

        {/* Mensaje de éxito al guardar */}
        {savedSuccess && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={18} color={COLORS.primaryLight} />
            <Text style={styles.successText}>¡Configuración guardada correctamente!</Text>
          </View>
        )}

        {/* 1. Salario Base */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.primaryBg }]}>
              <MaterialCommunityIcons name="cash-multiple" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>Salario Base Mensual ($ USD)</Text>
              <Text style={styles.cardSub}>Tu sueldo regular por mes completo</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.textInput}
              keyboardType="numeric"
              value={baseSalary}
              onChangeText={setBaseSalary}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ mes</Text>
          </View>
        </View>

        {/* 1.5. % Salario Base Día 1 */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <MaterialCommunityIcons name="percent" size={20} color={COLORS.indigoLight} />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>% Salario Base Pagado el Día 1</Text>
              <Text style={styles.cardSub}>
                Día 1: {firstCutPercent || '0'}% • Día 15: {parseFloat(Math.max(0, 100 - (parseFloat(String(firstCutPercent).replace(',', '.')) || 0)).toFixed(2))}% restante
              </Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.indigoLight }]}>%</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.indigoLight }]}
              keyboardType="decimal-pad"
              value={firstCutPercent}
              onChangeText={(val) => {
                const clean = val.replace(/[^0-9.,]/g, '');
                setFirstCutPercent(clean);
              }}
              placeholder="50.0"
              placeholderTextColor={COLORS.textMuted}
              maxLength={6}
            />
            <Text style={styles.unitText}>% a cobrar día 1</Text>
          </View>

          {/* Chips de porcentajes comunes */}
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10, justifyContent: 'center' }}>
            {[30, 40, 50, 60, 70].map((pct) => (
              <TouchableOpacity
                key={pct}
                style={{
                  backgroundColor: parseFloat(String(firstCutPercent).replace(',', '.')) === pct ? COLORS.indigo : COLORS.surface,
                  paddingVertical: 5,
                  paddingHorizontal: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: COLORS.border,
                }}
                onPress={() => setFirstCutPercent(String(pct))}
              >
                <Text
                  style={{
                    color: parseFloat(String(firstCutPercent).replace(',', '.')) === pct ? '#FFFFFF' : COLORS.textSecondary,
                    fontWeight: '700',
                    fontSize: 12,
                  }}
                >
                  {pct}%
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.bcvNoteText}>
            📌 Nota: El 100% de las guardias, horas extras y días especiales se sumarán automáticamente al corte del día 1. El día 15 cobra el restante del salario base.
          </Text>
        </View>

        {/* 2. Horas Extras */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.overtimeBg }]}>
              <MaterialCommunityIcons name="clock-time-four" size={20} color={COLORS.overtime} />
            </View>
            <View style={styles.cardTitleGroup}>
              <View style={styles.titleWithPencilRow}>
                <Text style={styles.cardTitle}>{overtimeName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() =>
                    handleOpenEditModal(
                      'overtimeName',
                      overtimeName,
                      DEFAULT_SETTINGS.overtimeName,
                      'Horas Extras',
                      COLORS.overtime,
                      ['Horas Extras', 'Sobretiempo', 'Horas Adicionales', 'Guardia de Horas']
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="pencil" size={15} color={COLORS.overtime} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>Monto recibido por cada hora adicional</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.overtime }]}>$</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.overtime }]}
              keyboardType="numeric"
              value={overtimeRate}
              onChangeText={setOvertimeRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ hora</Text>
          </View>
        </View>

        {/* 3. Guardia Regular */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.guardiaBg }]}>
              <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.guardia} />
            </View>
            <View style={styles.cardTitleGroup}>
              <View style={styles.titleWithPencilRow}>
                <Text style={styles.cardTitle}>{guardDutyName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() =>
                    handleOpenEditModal(
                      'guardDutyName',
                      guardDutyName,
                      DEFAULT_SETTINGS.guardDutyName,
                      'Guardia Regular',
                      COLORS.guardia,
                      ['Guardia', 'Guardia Regular', 'Guardia Nocturna', 'Guardia 12h', 'Guardia Pasiva']
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="pencil" size={15} color={COLORS.guardia} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>Tarifa recibida por cada día asignado</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.guardia }]}>$</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.guardia }]}
              keyboardType="numeric"
              value={guardDutyRate}
              onChangeText={setGuardDutyRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ día</Text>
          </View>
        </View>

        {/* 3.5. Guardia Completa */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.guardiaCompletaBg }]}>
              <MaterialCommunityIcons name="shield-star" size={20} color={COLORS.guardiaCompleta} />
            </View>
            <View style={styles.cardTitleGroup}>
              <View style={styles.titleWithPencilRow}>
                <Text style={styles.cardTitle}>{fullGuardDutyName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() =>
                    handleOpenEditModal(
                      'fullGuardDutyName',
                      fullGuardDutyName,
                      DEFAULT_SETTINGS.fullGuardDutyName,
                      'Guardia Completa',
                      COLORS.guardiaCompleta,
                      ['Guardia Completa', 'Guardia 24h', 'Guardia Activa', 'Guardia Total']
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="pencil" size={15} color={COLORS.guardiaCompleta} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>Tarifa por cada día de guardia completa</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.guardiaCompleta }]}>$</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.guardiaCompleta }]}
              keyboardType="numeric"
              value={fullGuardDutyRate}
              onChangeText={setFullGuardDutyRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ día</Text>
          </View>
        </View>

        {/* 4. Fin de Semana */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.weekendBg }]}>
              <MaterialCommunityIcons name="beach" size={20} color={COLORS.weekend} />
            </View>
            <View style={styles.cardTitleGroup}>
              <View style={styles.titleWithPencilRow}>
                <Text style={styles.cardTitle}>{weekendName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() =>
                    handleOpenEditModal(
                      'weekendName',
                      weekendName,
                      DEFAULT_SETTINGS.weekendName,
                      'Fin de Semana',
                      COLORS.weekend,
                      ['Fin de Semana', 'Guardia Fin de Semana', 'Sábado / Domingo', 'Día Libre']
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="pencil" size={15} color={COLORS.weekend} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>Monto recibido por día sábado o domingo trabajado</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.weekend }]}>$</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.weekend }]}
              keyboardType="numeric"
              value={weekendRate}
              onChangeText={setWeekendRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ fin de sem.</Text>
          </View>
        </View>

        {/* 5. Guardia Especial */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: COLORS.specialBg }]}>
              <MaterialCommunityIcons name="star-circle" size={20} color={COLORS.special} />
            </View>
            <View style={styles.cardTitleGroup}>
              <View style={styles.titleWithPencilRow}>
                <Text style={styles.cardTitle}>{specialPayName}</Text>
                <TouchableOpacity
                  style={styles.pencilBtn}
                  onPress={() =>
                    handleOpenEditModal(
                      'specialPayName',
                      specialPayName,
                      DEFAULT_SETTINGS.specialPayName,
                      'Guardia Especial',
                      COLORS.special,
                      ['Guardia Especial', 'Guardia Feriado', 'Guardia Festiva', 'Guardia Extraordinaria']
                    )
                  }
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialCommunityIcons name="pencil" size={15} color={COLORS.special} />
                </TouchableOpacity>
              </View>
              <Text style={styles.cardSub}>Tarifa sugerida por defecto para guardias especiales</Text>
            </View>
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.special }]}>$</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.special }]}
              keyboardType="numeric"
              value={specialPayRate}
              onChangeText={setSpecialPayRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ día</Text>
          </View>
        </View>

        {/* 6. Tasa Banco Central de Venezuela */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(99, 102, 241, 0.15)' }]}>
              <MaterialCommunityIcons name="bank" size={20} color={COLORS.indigoLight} />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>Tasa Banco Central de Venezuela</Text>
              <Text style={styles.cardSub}>
                {bcvData?.date ? `Oficial BCV (${bcvData.date})` : 'Tasa de cambio del día'}
              </Text>
            </View>

            {onRefreshBcv && (
              <TouchableOpacity
                style={styles.refreshBcvBtn}
                onPress={onRefreshBcv}
                disabled={bcvLoading}
                activeOpacity={0.7}
              >
                {bcvLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primaryLight} />
                ) : (
                  <MaterialCommunityIcons name="sync" size={18} color={COLORS.primaryLight} />
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.inputRow}>
            <Text style={[styles.currencySymbol, { color: COLORS.indigoLight }]}>Bs.</Text>
            <TextInput
              style={[styles.textInput, { color: COLORS.indigoLight }]}
              keyboardType="numeric"
              value={manualBcvRate}
              onChangeText={setManualBcvRate}
              placeholder="0.00"
              placeholderTextColor={COLORS.textMuted}
            />
            <Text style={styles.unitText}>/ USD</Text>
          </View>
          <Text style={styles.bcvNoteText}>
            💡 Se actualiza automáticamente cada día vía API oficial. También puedes editarla manualmente si lo deseas.
          </Text>
        </View>

        {/* 7. Actualizaciones de la Aplicación (GitHub Releases) */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
              <MaterialCommunityIcons name="cloud-download-outline" size={20} color={COLORS.guardia} />
            </View>
            <View style={styles.cardTitleGroup}>
              <Text style={styles.cardTitle}>Actualizaciones de la App</Text>
              <Text style={styles.cardSub}>
                Versión instalada: v{APP_VERSION} • GitHub Releases
              </Text>
            </View>
          </View>

          {/* Repositorio Configurado */}
          <View style={styles.repoConfigBox}>
            <View style={styles.repoHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MaterialCommunityIcons name="github" size={16} color={COLORS.textSecondary} />
                <Text style={styles.repoLabel}>Repositorio de origen:</Text>
              </View>
              <TouchableOpacity
                style={styles.pencilBtn}
                onPress={() =>
                  handleOpenEditModal(
                    'githubRepo',
                    githubRepo,
                    DEFAULT_GITHUB_REPO,
                    'Repositorio GitHub',
                    COLORS.guardia,
                    ['EduardoOG14/calculadora-salarial']
                  )
                }
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialCommunityIcons name="pencil" size={14} color={COLORS.guardia} />
              </TouchableOpacity>
            </View>
            <Text style={styles.repoValueText} numberOfLines={1}>
              {githubRepo}
            </Text>
          </View>

          {/* Botón Buscar Actualizaciones */}
          <TouchableOpacity
            style={[styles.checkUpdateBtn, checkingUpdate && styles.checkUpdateBtnDisabled]}
            onPress={handleCheckUpdates}
            disabled={checkingUpdate}
            activeOpacity={0.8}
          >
            {checkingUpdate ? (
              <>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={styles.checkUpdateBtnText}>Comprobando en GitHub...</Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="sync" size={18} color="#0F172A" />
                <Text style={styles.checkUpdateBtnText}>Buscar Actualizaciones</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Mensaje de estado de la búsqueda */}
          {updateStatus && (
            <View
              style={[
                styles.updateStatusBox,
                updateStatus.type === 'success' && styles.updateStatusBoxSuccess,
                updateStatus.type === 'available' && styles.updateStatusBoxAvailable,
                updateStatus.type === 'info' && styles.updateStatusBoxInfo,
                updateStatus.type === 'error' && styles.updateStatusBoxError,
              ]}
            >
              <MaterialCommunityIcons
                name={
                  updateStatus.type === 'success'
                    ? 'check-circle'
                    : updateStatus.type === 'available'
                    ? 'arrow-up-bold-circle'
                    : updateStatus.type === 'info'
                    ? 'information'
                    : 'alert-circle'
                }
                size={18}
                color={
                  updateStatus.type === 'success'
                    ? COLORS.primaryLight
                    : updateStatus.type === 'available'
                    ? COLORS.guardia
                    : updateStatus.type === 'info'
                    ? COLORS.indigoLight
                    : COLORS.danger
                }
              />
              <Text
                style={[
                  styles.updateStatusText,
                  updateStatus.type === 'success' && { color: COLORS.primaryLight },
                  updateStatus.type === 'available' && { color: COLORS.guardia },
                  updateStatus.type === 'info' && { color: COLORS.indigoLight },
                  updateStatus.type === 'error' && { color: COLORS.danger },
                ]}
              >
                {updateStatus.message}
              </Text>
            </View>
          )}

          <Text style={styles.bcvNoteText}>
            💡 Comprueba automáticamente si hay un nuevo release publicado en GitHub con el archivo APK instalable.
          </Text>
        </View>

        {/* Resumen de configuración */}
        <View style={styles.summaryNotice}>
          <MaterialCommunityIcons name="calculator" size={20} color={COLORS.indigoLight} />
          <Text style={styles.summaryNoticeText}>
            Con esta configuración: cada {guardDutyName} sumará {formatUSD(guardDutyRate)}, {fullGuardDutyName} {formatUSD(fullGuardDutyRate)}, {specialPayName} {formatUSD(specialPayRate)}, {weekendName} {formatUSD(weekendRate)} y {overtimeName} {formatUSD(overtimeRate)}/h.
          </Text>
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="content-save-outline" size={20} color="#0F172A" />
            <Text style={styles.saveBtnText}>Guardar Configuración</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.resetBtn}
            onPress={handleReset}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name="restore" size={18} color={COLORS.textSecondary} />
            <Text style={styles.resetBtnText}>Restablecer valores por defecto</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal para Editar Nombre con Lápiz */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditModalVisible(false)}
          />

          <View style={styles.modalContent}>
            {/* Cabecera del Modal */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconBox, { backgroundColor: `${modalConfig.color}22` }]}>
                <MaterialCommunityIcons name="pencil" size={20} color={modalConfig.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Editar {modalConfig.title}</Text>
                <Text style={styles.modalSubTitle}>
                  Personaliza cómo se mostrará en calendarios y reportes
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setEditModalVisible(false)}
              >
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Campo de Texto */}
            <View style={styles.modalInputBox}>
              <Text style={styles.modalInputLabel}>Valor asignado:</Text>
              <View style={[styles.modalInputWrapper, { borderColor: modalConfig.color }]}>
                <TextInput
                  style={styles.modalTextInput}
                  value={modalTempName}
                  onChangeText={setModalTempName}
                  placeholder="Escribe el valor..."
                  placeholderTextColor={COLORS.textMuted}
                  autoFocus={true}
                  selectTextOnFocus={true}
                  maxLength={50}
                />
                {modalTempName.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setModalTempName('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialCommunityIcons name="close-circle" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Chips de sugerencias rápidas */}
            {modalConfig.suggestions && modalConfig.suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>Sugerencias rápidas:</Text>
                <View style={styles.suggestionsRow}>
                  {modalConfig.suggestions.map((sug) => (
                    <TouchableOpacity
                      key={sug}
                      style={[
                        styles.sugChip,
                        modalTempName === sug && { borderColor: modalConfig.color, backgroundColor: `${modalConfig.color}22` },
                      ]}
                      onPress={() => setModalTempName(sug)}
                    >
                      <Text
                        style={[
                          styles.sugChipText,
                          modalTempName === sug && { color: modalConfig.color, fontWeight: '700' },
                        ]}
                      >
                        {sug}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Botones de acción */}
            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalResetBtn}
                onPress={() => setModalTempName(modalConfig.defaultVal)}
              >
                <MaterialCommunityIcons name="restore" size={16} color={COLORS.textMuted} />
                <Text style={styles.modalResetText}>Por defecto</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalApplyBtn, { backgroundColor: modalConfig.color }]}
                onPress={handleApplyModalName}
              >
                <MaterialCommunityIcons name="check" size={18} color="#0F172A" />
                <Text style={styles.modalApplyText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de Actualización Disponible */}
      <Modal
        visible={updateModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setUpdateModalVisible(false)}
          />

          <View style={styles.updateModalCard}>
            <View style={styles.updateModalHeader}>
              <View style={styles.updateModalBadge}>
                <MaterialCommunityIcons name="rocket-launch" size={26} color={COLORS.primaryLight} />
              </View>
              <Text style={styles.updateModalTitle}>¡Nueva versión disponible!</Text>
              <Text style={styles.updateModalSubtitle}>
                Versión v{updateData?.latestVersion} (Tienes v{APP_VERSION})
              </Text>
            </View>

            {/* Chips informativos */}
            <View style={styles.updateChipsRow}>
              {updateData?.assetSizeMb && (
                <View style={styles.updateInfoChip}>
                  <MaterialCommunityIcons name="file-download-outline" size={13} color={COLORS.textSecondary} />
                  <Text style={styles.updateInfoChipText}>~{updateData.assetSizeMb} MB</Text>
                </View>
              )}
              <View style={styles.updateInfoChip}>
                <MaterialCommunityIcons name="android" size={13} color={COLORS.primaryLight} />
                <Text style={[styles.updateInfoChipText, { color: COLORS.primaryLight }]}>APK Oficial</Text>
              </View>
            </View>

            {/* Notas de la versión */}
            <Text style={styles.updateNotesHeader}>Novedades de la actualización:</Text>
            <ScrollView style={styles.updateNotesScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.updateNotesText}>
                {updateData?.releaseNotes || 'Mejoras y optimizaciones generales del sistema.'}
              </Text>
            </ScrollView>

            {/* Descarga / Instalación */}
            {isDownloading ? (
              <View style={styles.downloadProgressContainer}>
                <View style={styles.downloadProgressHeader}>
                  <ActivityIndicator size="small" color={COLORS.primaryLight} />
                  <Text style={styles.downloadProgressTitle}>
                    {downloadProgress >= 100
                      ? 'Iniciando instalador...'
                      : `Descargando actualización: ${downloadProgress}%`}
                  </Text>
                </View>

                {/* Barra de progreso visual */}
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      { width: `${Math.max(6, Math.min(100, downloadProgress))}%` },
                    ]}
                  />
                </View>

                <Text style={styles.downloadProgressHint}>
                  La actualización se descarga directamente en tu dispositivo. Al completarse, se abrirá el asistente del sistema para confirmar la instalación.
                </Text>
              </View>
            ) : (
              <View style={styles.updateModalActions}>
                {downloadError && (
                  <View style={styles.downloadErrorBox}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color={COLORS.danger} />
                    <Text style={styles.downloadErrorText}>{downloadError}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.updateDownloadBtn}
                  onPress={handleDirectUpdate}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={20} color="#0F172A" />
                  <Text style={styles.updateDownloadBtnText}>Instalar Actualización Ahora</Text>
                </TouchableOpacity>

                <View style={styles.updateSecondaryRow}>
                  {updateData?.releasePageUrl && (
                    <TouchableOpacity
                      style={styles.updateViewGitHubBtn}
                      onPress={() => {
                        openUpdateDownloadUrl(updateData.releasePageUrl);
                      }}
                    >
                      <MaterialCommunityIcons name="open-in-new" size={14} color={COLORS.textSecondary} />
                      <Text style={styles.updateViewGitHubText}>Enlace externo</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.updateLaterBtn}
                    onPress={() => {
                      setUpdateModalVisible(false);
                      setDownloadError(null);
                    }}
                  >
                    <Text style={styles.updateLaterText}>Más tarde</Text>
                  </TouchableOpacity>
                </View>
              </View>
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
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleGroup: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  cardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  refreshBcvBtn: {
    padding: 8,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  bcvNoteText: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 8,
    lineHeight: 16,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 6,
  },
  textInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    paddingVertical: 8,
  },
  unitText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  subOptionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  freqBtn: {
    flex: 1,
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  freqBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryBg,
  },
  freqBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  freqBtnTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  summaryNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  summaryNoticeText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: 11,
    lineHeight: 17,
  },
  actionsContainer: {
    gap: 10,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  saveBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 15,
  },
  resetBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  resetBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  titleWithPencilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pencilBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  modalIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.text,
  },
  modalSubTitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalInputBox: {
    marginBottom: 16,
  },
  modalInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  modalInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  modalTextInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    paddingVertical: 8,
  },
  suggestionsContainer: {
    marginBottom: 18,
  },
  suggestionsTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  sugChip: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  sugChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  modalActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  modalResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  modalResetText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  modalApplyBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  modalApplyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  repoConfigBox: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  repoHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  repoLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  repoValueText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  checkUpdateBtn: {
    backgroundColor: COLORS.guardia,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    shadowColor: COLORS.guardia,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3,
  },
  checkUpdateBtnDisabled: {
    opacity: 0.7,
  },
  checkUpdateBtnText: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 14,
  },
  updateStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  updateStatusBoxSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: COLORS.primaryDark,
  },
  updateStatusBoxAvailable: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: COLORS.guardia,
  },
  updateStatusBoxInfo: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: COLORS.indigo,
  },
  updateStatusBoxError: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: COLORS.danger,
  },
  updateStatusText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  updateModalCard: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    backgroundColor: COLORS.surfaceCard,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 10,
  },
  updateModalHeader: {
    alignItems: 'center',
    marginBottom: 12,
  },
  updateModalBadge: {
    width: 50,
    height: 50,
    borderRadius: 15,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: COLORS.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.text,
    textAlign: 'center',
  },
  updateModalSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  updateChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  updateInfoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  updateInfoChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  updateNotesHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  updateNotesScroll: {
    maxHeight: 130,
    backgroundColor: COLORS.surface,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  updateNotesText: {
    color: COLORS.text,
    fontSize: 12,
    lineHeight: 18,
  },
  updateModalActions: {
    gap: 8,
  },
  updateDownloadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  updateDownloadBtnText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '900',
  },
  updateSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  updateViewGitHubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  updateViewGitHubText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  updateLaterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  updateLaterText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  downloadProgressContainer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  downloadProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  downloadProgressTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 10,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 6,
  },
  downloadProgressHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  downloadErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: COLORS.danger,
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  downloadErrorText: {
    flex: 1,
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
  },
});
