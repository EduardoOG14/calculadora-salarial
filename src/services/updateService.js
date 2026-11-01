import { Linking } from 'react-native';
import { APP_VERSION, DEFAULT_GITHUB_REPO } from '../constants/version';

/**
 * Compara dos versiones en formato semver (ej: "1.0.1" vs "1.0.0", o con prefijo "v1.0.1")
 * Retorna:
 *   1 si v1 > v2 (v1 es más reciente)
 *  -1 si v1 < v2 (v1 es más antigua)
 *   0 si son iguales
 */
export function compareVersions(v1, v2) {
  if (!v1 || !v2) return 0;
  const clean1 = String(v1).replace(/^v/i, '').trim();
  const clean2 = String(v2).replace(/^v/i, '').trim();

  // Separar sufijos pre-release como -beta, -rc
  const [core1] = clean1.split('-');
  const [core2] = clean2.split('-');

  const parts1 = core1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = core2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0;
    const num2 = parts2[i] || 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }

  return 0;
}

/**
 * Consulta la API pública de GitHub para obtener la última versión publicada
 * @param {string} repository - Repositorio en formato "usuario/repo"
 * @returns {Promise<Object>} Resultado de la verificación
 */
export async function checkForAppUpdates(repository = DEFAULT_GITHUB_REPO) {
  const cleanRepo = (repository || DEFAULT_GITHUB_REPO).trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '');

  if (!cleanRepo || !cleanRepo.includes('/')) {
    return {
      success: false,
      error: 'El formato del repositorio no es válido. Usa: usuario/repositorio',
    };
  }

  const apiUrl = `https://api.github.com/repos/${cleanRepo}/releases/latest`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: {
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'CalculadoraSalarialApp',
      },
    });

    clearTimeout(timeoutId);

    if (response.status === 404) {
      return {
        success: true,
        hasUpdate: false,
        noReleases: true,
        currentVersion: APP_VERSION,
        message: `No se encontraron releases publicadas aún en ${cleanRepo}.`,
      };
    }

    if (response.status === 403) {
      return {
        success: false,
        error: 'Límite de peticiones de GitHub alcanzado temporalmente. Intenta nuevamente en unos minutos.',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: `Error al consultar GitHub (Código ${response.status}). Verifica que el repositorio exista y sea público.`,
      };
    }

    const data = await response.json();
    const latestTag = data.tag_name || data.name || '';
    const cleanLatestVersion = latestTag.replace(/^v/i, '').trim();

    // Comparar con la versión actual de la app
    const isNewer = compareVersions(cleanLatestVersion, APP_VERSION) > 0;

    // Buscar archivo APK adjunto en los assets del release
    const apkAsset = Array.isArray(data.assets)
      ? data.assets.find((asset) => asset.name && asset.name.toLowerCase().endsWith('.apk'))
      : null;

    const downloadUrl = apkAsset ? apkAsset.browser_download_url : data.html_url;
    const assetSizeMb = apkAsset && apkAsset.size
      ? (apkAsset.size / (1024 * 1024)).toFixed(1)
      : null;

    return {
      success: true,
      hasUpdate: isNewer,
      noReleases: false,
      currentVersion: APP_VERSION,
      latestVersion: cleanLatestVersion,
      rawTag: latestTag,
      releaseTitle: data.name || latestTag,
      releaseNotes: data.body || 'Sin descripción detallada.',
      publishedAt: data.published_at,
      downloadUrl: downloadUrl,
      releasePageUrl: data.html_url,
      assetName: apkAsset?.name || null,
      assetSizeMb: assetSizeMb,
      downloadCount: apkAsset?.download_count || 0,
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: 'El tiempo de espera se agotó al conectar con GitHub. Revisa tu conexión a internet.',
      };
    }
    return {
      success: false,
      error: 'No se pudo conectar a GitHub. Verifica tu conexión a internet.',
    };
  }
}

/**
 * Abre el enlace de descarga o la página del release en el navegador/gestor de descargas de Android
 */
export async function openUpdateDownloadUrl(url) {
  if (!url) return false;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    } else {
      await Linking.openURL(url);
      return true;
    }
  } catch (err) {
    console.error('Error al abrir URL de descarga:', err);
    return false;
  }
}
