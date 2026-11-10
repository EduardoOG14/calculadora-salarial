import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  BackHandler,
} from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { COLORS, DEFAULT_SETTINGS } from './constants/theme';
import {
  getSettings,
  saveSettings,
  getMonthRecords,
  saveDayRecord,
  saveMultipleDaysRecords,
  clearMonthRecords,
} from './storage/storage';
import {
  fetchLiveBcvRate,
  getCachedBcvRate,
  saveManualBcvRate,
} from './services/bcvService';
import HomeScreen from './screens/HomeScreen';
import RecordsListScreen from './screens/RecordsListScreen';
import SettingsScreen from './screens/SettingsScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function App() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('calculator'); // 'calculator' | 'records' | 'settings'
  const [tabHistory, setTabHistory] = useState(['calculator']);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [bcvData, setBcvData] = useState({ rate: 887.30, date: null, lastFetched: null });
  const [bcvLoading, setBcvLoading] = useState(false);

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [records, setRecords] = useState({});

  // Configurar modo inmersivo en Android (ocultar botones del sistema y mostrar solo al deslizar)
  useEffect(() => {
    if (Platform.OS === 'android') {
      try {
        NavigationBar.setVisibilityAsync('hidden');
        NavigationBar.setBehaviorAsync('overlay-swipe');
        NavigationBar.setBackgroundColorAsync(COLORS.background);
        NavigationBar.setButtonStyleAsync('light');
      } catch (e) {
        console.log('Error configurando NavigationBar inmersivo:', e);
      }
    }
  }, []);

  // Manejar el botón de atrás físico/gestual de Android para volver al menú anterior
  useEffect(() => {
    const onBackPress = () => {
      // Si tenemos historial de pantallas previas visitadas
      if (tabHistory.length > 1) {
        setTabHistory((prev) => {
          const next = [...prev];
          next.pop(); // Elimina la pestaña actual
          const targetTab = next[next.length - 1];
          setActiveTab(targetTab);
          return next;
        });
        return true; // Previene salir de la aplicación
      }

      // Si no hay historial pero estamos en otra pestaña que no es el inicio
      if (activeTab !== 'calculator') {
        setActiveTab('calculator');
        setTabHistory(['calculator']);
        return true; // Previene salir de la aplicación
      }

      // Si ya está en la pantalla principal (Calendario), permitimos la salida normal
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress
    );
    return () => backHandler.remove();
  }, [tabHistory, activeTab]);

  // Cambiar de menú/pestaña guardando el historial de navegación
  const handleSwitchTab = (tab) => {
    if (tab !== activeTab) {
      setTabHistory((prev) => [...prev, tab]);
      setActiveTab(tab);
    }
  };

  // Carga inicial de configuración, registros y tasa BCV
  useEffect(() => {
    async function init() {
      try {
        const storedSettings = await getSettings();
        setSettings(storedSettings);
        const storedRecords = await getMonthRecords(year, month);
        setRecords(storedRecords);

        // Cargar tasa BCV desde caché local inmediatamente
        const cachedBcv = await getCachedBcvRate();
        setBcvData(cachedBcv);

        // Intentar actualizar la tasa en vivo desde la API oficial de BCV
        setBcvLoading(true);
        const liveBcv = await fetchLiveBcvRate();
        if (liveBcv && liveBcv.rate) {
          setBcvData(liveBcv);
        }
      } catch (e) {
        console.error('Error al inicializar app:', e);
      } finally {
        setLoading(false);
        setBcvLoading(false);
      }
    }
    init();
  }, []);

  const handleRefreshBcv = async () => {
    setBcvLoading(true);
    try {
      const updated = await fetchLiveBcvRate();
      if (updated && updated.rate) {
        setBcvData(updated);
      }
    } catch (e) {
      console.log('Error refrescando tasa BCV:', e);
    } finally {
      setBcvLoading(false);
    }
  };

  const handleSaveManualBcv = async (manualRate) => {
    const saved = await saveManualBcvRate(manualRate);
    if (saved) {
      setBcvData(saved);
    }
  };

  // Cargar registros al cambiar de mes o año
  const loadMonth = useCallback(async (y, m) => {
    try {
      const recs = await getMonthRecords(y, m);
      setRecords(recs);
    } catch (e) {
      console.error('Error al cargar mes:', e);
    }
  }, []);

  const handlePrevMonth = () => {
    let newM = month - 1;
    let newY = year;
    if (newM < 0) {
      newM = 11;
      newY = year - 1;
    }
    setYear(newY);
    setMonth(newM);
    loadMonth(newY, newM);
  };

  const handleNextMonth = () => {
    let newM = month + 1;
    let newY = year;
    if (newM > 11) {
      newM = 0;
      newY = year + 1;
    }
    setYear(newY);
    setMonth(newM);
    loadMonth(newY, newM);
  };

  const handleSaveDay = async (y, m, d, data) => {
    const updated = await saveDayRecord(y, m, d, data);
    if (updated) {
      setRecords({ ...updated });
    }
  };

  const handleSaveMultipleDays = async (y, m, daysArray, patchData) => {
    const updated = await saveMultipleDaysRecords(y, m, daysArray, patchData);
    if (updated) {
      setRecords({ ...updated });
    }
  };

  const handleClearMonth = async (y, m) => {
    const ok = await clearMonthRecords(y, m);
    if (ok) {
      setRecords({});
    }
  };

  const handleSaveSettings = async (newSettings) => {
    setSettings(newSettings);
    await saveSettings(newSettings);
  };

  const handleSelectDayFromList = (day) => {
    handleSwitchTab('calculator');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando calculadora salarial...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />

      {/* Contenido principal según Tab activa */}
      <View style={styles.mainContainer}>
        {activeTab === 'calculator' && (
          <HomeScreen
            settings={settings}
            year={year}
            month={month}
            records={records}
            bcvRate={bcvData.rate}
            bcvLoading={bcvLoading}
            onRefreshBcv={handleRefreshBcv}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            onSaveDay={handleSaveDay}
            onSaveMultipleDays={handleSaveMultipleDays}
            onClearMonth={handleClearMonth}
            onSaveSettings={handleSaveSettings}
          />
        )}

        {activeTab === 'records' && (
          <RecordsListScreen
            settings={settings}
            year={year}
            month={month}
            records={records}
            bcvRate={bcvData.rate}
            onClearMonth={handleClearMonth}
            onSaveDay={handleSaveDay}
            onSelectDay={handleSelectDayFromList}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsScreen
            settings={settings}
            bcvData={bcvData}
            bcvLoading={bcvLoading}
            onRefreshBcv={handleRefreshBcv}
            onSaveManualBcv={handleSaveManualBcv}
            onSaveSettings={handleSaveSettings}
          />
        )}
      </View>

      {/* Barra de Navegación Inferior */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={[styles.navItem, activeTab === 'calculator' && styles.navItemActive]}
          onPress={() => handleSwitchTab('calculator')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'calculator' ? 'calendar-month' : 'calendar-month-outline'}
            size={22}
            color={activeTab === 'calculator' ? COLORS.primary : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'calculator' && styles.navItemTextActive,
            ]}
          >
            Calendario
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'records' && styles.navItemActive]}
          onPress={() => handleSwitchTab('records')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'records' ? 'clipboard-text' : 'clipboard-text-outline'}
            size={22}
            color={activeTab === 'records' ? COLORS.indigoLight : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'records' && { color: COLORS.indigoLight, fontWeight: '700' },
            ]}
          >
            Resumen
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navItem, activeTab === 'settings' && styles.navItemActive]}
          onPress={() => handleSwitchTab('settings')}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons
            name={activeTab === 'settings' ? 'cog' : 'cog-outline'}
            size={22}
            color={activeTab === 'settings' ? COLORS.primaryLight : COLORS.textMuted}
          />
          <Text
            style={[
              styles.navItemText,
              activeTab === 'settings' && styles.navItemTextActive,
            ]}
          >
            Ajustes
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 14,
    fontWeight: '600',
  },
  mainContainer: {
    flex: 1,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  navItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  navItemText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 3,
  },
  navItemTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
});
