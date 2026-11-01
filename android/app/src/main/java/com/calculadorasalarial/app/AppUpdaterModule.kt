package com.calculadorasalarial.app

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import java.io.BufferedInputStream
import java.io.File
import java.io.FileOutputStream
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class AppUpdaterModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "AppUpdater"

    private fun sendEvent(eventName: String, params: WritableMap?) {
        try {
            reactApplicationContext
                .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
                .emit(eventName, params)
        } catch (e: Exception) {
            // Ignorar si el contexto JS aún no está listo
        }
    }

    @ReactMethod
    fun canInstallPackages(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                promise.resolve(reactApplicationContext.packageManager.canRequestPackageInstalls())
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun openInstallPermissionSettings() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val intent = Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
                    data = Uri.parse("package:${reactApplicationContext.packageName}")
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactApplicationContext.startActivity(intent)
            }
        } catch (e: Exception) {
            // Ignorar
        }
    }

    @ReactMethod
    fun downloadApk(downloadUrl: String, promise: Promise) {
        thread {
            try {
                val downloadDir = reactApplicationContext.getExternalFilesDir(Environment.DIRECTORY_DOWNLOADS)
                    ?: reactApplicationContext.cacheDir
                val apkFile = File(downloadDir, "CalculadoraSalarial_update.apk")
                if (apkFile.exists()) {
                    apkFile.delete()
                }

                var currentUrl = downloadUrl
                var connection: HttpURLConnection? = null
                var redirectCount = 0

                // Seguir redirecciones de GitHub a AWS S3 automáticamente
                while (redirectCount < 7) {
                    val url = URL(currentUrl)
                    connection = url.openConnection() as HttpURLConnection
                    connection.connectTimeout = 20000
                    connection.readTimeout = 40000
                    connection.instanceFollowRedirects = false
                    connection.setRequestProperty("User-Agent", "CalculadoraSalarialApp")
                    connection.connect()

                    val code = connection.responseCode
                    if (code in 300..399) {
                        val newLocation = connection.getHeaderField("Location")
                        connection.disconnect()
                        if (newLocation.isNullOrEmpty()) {
                            promise.reject("REDIRECT_ERROR", "Error de redirección al descargar la actualización.")
                            return@thread
                        }
                        currentUrl = newLocation
                        redirectCount++
                    } else if (code == HttpURLConnection.HTTP_OK) {
                        break
                    } else {
                        connection.disconnect()
                        promise.reject("HTTP_ERROR", "El servidor respondió con código $code")
                        return@thread
                    }
                }

                val conn = connection ?: run {
                    promise.reject("CONNECTION_ERROR", "No se pudo establecer conexión.")
                    return@thread
                }

                val contentLength = conn.contentLengthLong
                val input = BufferedInputStream(conn.inputStream)
                val output = FileOutputStream(apkFile)
                val buffer = ByteArray(8192)
                var bytesRead: Int
                var totalRead = 0L
                var lastProgressEmit = 0L

                while (input.read(buffer).also { bytesRead = it } != -1) {
                    output.write(buffer, 0, bytesRead)
                    totalRead += bytesRead

                    val now = System.currentTimeMillis()
                    if (now - lastProgressEmit > 120 || (contentLength > 0 && totalRead == contentLength)) {
                        lastProgressEmit = now
                        val percent = if (contentLength > 0) ((totalRead * 100) / contentLength).toInt() else -1
                        val map = Arguments.createMap().apply {
                            putInt("percent", percent)
                            putDouble("downloaded", totalRead.toDouble())
                            putDouble("total", contentLength.toDouble())
                        }
                        sendEvent("onDownloadProgress", map)
                    }
                }

                output.flush()
                output.close()
                input.close()
                conn.disconnect()

                val result = Arguments.createMap().apply {
                    putString("filePath", apkFile.absolutePath)
                    putDouble("fileSize", apkFile.length().toDouble())
                }
                promise.resolve(result)
            } catch (e: Exception) {
                promise.reject("DOWNLOAD_FAILED", e.message ?: "Fallo al descargar la actualización.", e)
            }
        }
    }

    @ReactMethod
    fun installApk(filePath: String, promise: Promise) {
        try {
            val file = File(filePath)
            if (!file.exists()) {
                promise.reject("FILE_NOT_FOUND", "El archivo de actualización no fue encontrado.")
                return
            }

            // Comprobar permiso de instalación en Android 8.0+
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                if (!reactApplicationContext.packageManager.canRequestPackageInstalls()) {
                    openInstallPermissionSettings()
                    promise.reject("PERMISSION_DENIED", "Debes activar el permiso 'Instalar apps desconocidas' para completar la actualización.")
                    return
                }
            }

            val uri = FileProvider.getUriForFile(
                reactApplicationContext,
                "${reactApplicationContext.packageName}.fileprovider",
                file
            )

            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(uri, "application/vnd.android.package-archive")
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }

            reactApplicationContext.startActivity(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("INSTALL_FAILED", e.message ?: "No se pudo iniciar la instalación del APK.", e)
        }
    }
}
