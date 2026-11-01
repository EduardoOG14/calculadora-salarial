export const COLORS = {
  background: '#0B0F19',
  surface: '#161F30',
  surfaceCard: '#1E293B',
  surfaceLight: '#26334D',
  border: '#334155',
  borderLight: '#475569',
  
  primary: '#10B981',       // Verde esmeralda (Dinero / Total)
  primaryLight: '#34D399',
  primaryDark: '#059669',
  primaryBg: 'rgba(16, 185, 129, 0.12)',

  indigo: '#6366F1',        // Calendario y acentos
  indigoLight: '#818CF8',
  indigoBg: 'rgba(99, 102, 241, 0.15)',

  guardia: '#38BDF8',       // Azul cielo brillante para guardia
  guardiaDark: '#0284C7',
  guardiaBg: 'rgba(56, 189, 248, 0.15)',

  guardiaCompleta: '#A855F7', // Morado / Violeta brillante para guardia completa
  guardiaCompletaDark: '#7E22CE',
  guardiaCompletaBg: 'rgba(168, 85, 247, 0.15)',

  overtime: '#FBBF24',      // Ámbar brillante para horas extras
  overtimeDark: '#D97706',
  overtimeBg: 'rgba(251, 191, 36, 0.15)',

  weekend: '#F472B6',       // Rosa brillante para fin de semana
  weekendDark: '#DB2777',
  weekendBg: 'rgba(244, 114, 182, 0.15)',

  special: '#FB923C',       // Naranja brillante para pago especial
  specialDark: '#EA580C',
  specialBg: 'rgba(251, 146, 60, 0.15)',

  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',

  danger: '#EF4444',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  success: '#10B981',
};

export const DEFAULT_SETTINGS = {
  baseSalary: 1200,          // Salario base mensual en USD
  firstCutPercent: 50,       // % del salario base a pagar el día 1 (el resto va al día 15)
  overtimeRate: 15,          // USD por hora extra
  guardDutyRate: 50,         // USD por día de guardia regular
  fullGuardDutyRate: 80,     // USD por día de guardia completa
  weekendRate: 40,           // USD por fin de semana trabajado
  specialPayRate: 50,        // USD por guardia especial
  guardDutyName: 'Guardia Regular',     // Nombre personalizable para guardia regular
  fullGuardDutyName: 'Guardia Completa', // Nombre personalizable para guardia completa
  specialPayName: 'Guardia Especial',    // Nombre personalizable para guardia especial
  overtimeName: 'Horas Extras',          // Nombre personalizable para horas extras
  weekendName: 'Fin de Semana',          // Nombre personalizable para fin de semana
  githubRepo: 'EduardoOG14/calculadora-salarial', // Repositorio GitHub para buscar actualizaciones
};
