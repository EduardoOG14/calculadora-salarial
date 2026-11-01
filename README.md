# 📱 Calculadora Salarial para Android

Una aplicación móvil moderna diseñada para calcular de forma automática y precisa tu salario en **Dólares ($ USD)** y su equivalente oficial en **Bolívares (Bs. BCV)**, considerando cortes quincenales (1 y 15), salarios base en porcentajes, guardias, horas extras y fines de semana trabajados.

---

## ✨ Características Principales

1. **Cortes Quincenales Dinámicos (1 y 15):**
   - **Pago Día 1:** Cobra un porcentaje configurable del salario base (con decimales permitidos, ej: 50.5%) + el 100% de todas las guardias, horas extras y adicionales.
   - **Pago Día 15:** Cobra el porcentaje restante del salario base mensual.

2. **Calendario Táctil Avanzado con Respuesta Inmediata:**
   - Selección táctil sin retraso (`delayPressIn={0}`).
   - **Soporte para Dejar Presionado:** Mantén presionado un día para activar la selección múltiple o mantén presionado para seleccionar bloques continuos con vibración háptica.
   - **Presets Rápidos en 1 Toque:**
     - 🏖️ **Fines de semana:** Marca/desmarca todos los sábados y domingos del mes.
     - 💼 **Semana actual:** Selecciona automáticamente los días de lunes a viernes en curso.
     - 🗓️ **Todo el mes:** Marca el mes completo.
   - Modal por lotes independiente para asignar guardias y/o fines de semana.

3. **Personalización Total de Conceptos (Lápiz ✏️):**
   - Personaliza los nombres de tus guardias (ej. *Guardia Regular*, *Guardia Completa*, *Guardia Especial*, *Horas Extras*, *Fin de Semana*) y se reflejará en toda la app.
   - Guardias especiales con monto editable día a día.

4. **Tasa Oficial BCV en Vivo & Modo Offline:**
   - Consulta diaria automática de la tasa oficial del Banco Central de Venezuela.
   - Opción de actualizar manualmente o fijar una tasa personalizada.

5. **Sistema de Actualizaciones In-App vía GitHub Releases:**
   - Comprueba directamente desde la app si hay una nueva versión disponible en GitHub.
   - Permite descargar e instalar el archivo APK oficial con un solo toque.

---

## 🚀 Publicación y Actualizaciones en GitHub

El proyecto es 100% independiente de servicios cloud de terceros (sin dependencias de EAS ni cuentas de Expo Cloud).

### Subir el proyecto a GitHub:
```powershell
# 1. Añadir los archivos y crear el commit inicial
git add .
git commit -m "feat: Calculadora Salarial v1.0.0 con actualizador GitHub"

# 2. Configurar la rama principal
git branch -M main

# 3. Vincular tu repositorio remoto de GitHub (o SSH git@github.com:EduardoOG14/calculadora-salarial.git)
git remote add origin https://github.com/EduardoOG14/calculadora-salarial.git

# 4. Subir el código
git push -u origin main
```

### Publicar una nueva versión con actualización automática:
1. Compila el APK localmente:
   ```powershell
   $env:ANDROID_HOME = "C:\Users\EduardoOG\AppData\Local\Android\Sdk"
   $env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
   Set-Location android
   .\gradlew.bat assembleRelease
   ```
2. En GitHub, crea un nuevo **Release** (por ejemplo con la etiqueta `v1.0.1`).
3. Adjunta el archivo `CalculadoraSalarial.apk` a los **Assets** del release.
4. Al abrir la app en tu teléfono y pulsar **"Buscar Actualizaciones"**, detectará la nueva versión y permitirá descargar e instalar el APK directamente.

---

## 📁 Estructura del Código

```
Calculadora salarial/
├── android/                        # Proyecto nativo Gradle Android
├── assets/                         # Icono de la app y recursos gráficos
├── src/
│   ├── components/
│   │   ├── CalendarView.js         # Calendario con gestos y selección en lote
│   │   ├── DayModal.js             # Modal de configuración de día individual
│   │   ├── MultiDayModal.js        # Modal de configuración por lote de días
│   │   └── SalarySummaryCard.js    # Resumen de cortes 1 y 15 con desglose
│   ├── constants/
│   │   ├── theme.js                # Paleta de colores dark mode y ajustes iniciales
│   │   └── version.js              # Versión actual de la app y repo de GitHub
│   ├── screens/
│   │   ├── HomeScreen.js           # Pantalla principal (Calendario + Resumen)
│   │   ├── RecordsListScreen.js    # Historial detallado día a día
│   │   └── SettingsScreen.js       # Configuración, edición de nombres y actualizaciones
│   ├── services/
│   │   ├── bcvService.js           # Servicio de consulta de tasa oficial BCV
│   │   └── updateService.js        # Servicio de comprobación de releases en GitHub
│   ├── storage/
│   │   └── storage.js              # Persistencia con AsyncStorage
│   ├── utils/
│   │   └── calculator.js           # Lógica salarial y generador de reporte de texto
│   └── App.js                      # Navegación y ciclo de vida de la aplicación
├── app.json                        # Configuración de React Native / Expo
└── package.json                    # Dependencias del proyecto
```
