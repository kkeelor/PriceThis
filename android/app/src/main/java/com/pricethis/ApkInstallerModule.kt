package com.pricethis

import android.content.ActivityNotFoundException
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.FileProvider
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import java.io.File

class ApkInstallerModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "ApkInstaller"

  @ReactMethod
  fun canInstall(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        promise.resolve(reactContext.packageManager.canRequestPackageInstalls())
      } else {
        promise.resolve(true)
      }
    } catch (error: Exception) {
      promise.reject("ERR", error.message, error)
    }
  }

  @ReactMethod
  fun openInstallPermissionSettings(promise: Promise) {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val opened = openInstallPermissionSettingsInternal()
        if (!opened) {
          promise.reject("ERR", "Could not open install permission settings on this device")
          return
        }
      }
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("ERR", error.message, error)
    }
  }

  @ReactMethod
  fun install(path: String, promise: Promise) {
    try {
      val apkFile = File(path.removePrefix("file://"))
      if (!apkFile.exists()) {
        promise.reject("ERR", "Downloaded APK not found")
        return
      }

      if (apkFile.length() < 1024L * 100L) {
        promise.reject("ERR", "Downloaded APK looks incomplete")
        return
      }

      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O &&
        !reactContext.packageManager.canRequestPackageInstalls()) {
        openInstallPermissionSettingsInternal()
        promise.reject("PERMISSION", "Install permission not granted")
        return
      }

      val uri =
        FileProvider.getUriForFile(
          reactContext,
          "${reactContext.packageName}.provider",
          apkFile,
        )

      val intent =
        Intent(Intent.ACTION_VIEW).apply {
          setDataAndType(uri, "application/vnd.android.package-archive")
          addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }

      startSettingsOrInstallIntent(intent)
      promise.resolve(null)
    } catch (error: Exception) {
      promise.reject("ERR", error.message, error)
    }
  }

  private fun openInstallPermissionSettingsInternal(): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
      return true
    }

    val packageUri = Uri.parse("package:${reactContext.packageName}")
    val intents =
      listOf(
        Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES).apply {
          data = packageUri
        },
        Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES),
        Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
          data = packageUri
        },
      )

    for (intent in intents) {
      if (tryStartActivity(intent)) {
        return true
      }
    }

    return false
  }

  private fun startSettingsOrInstallIntent(intent: Intent) {
    if (!tryStartActivity(intent)) {
      throw ActivityNotFoundException("No activity found to handle install intent")
    }
  }

  private fun tryStartActivity(intent: Intent): Boolean {
    val packageManager = reactContext.packageManager
    if (intent.resolveActivity(packageManager) == null) {
      return false
    }

    val activity = reactContext.currentActivity
    return try {
      if (activity != null) {
        activity.startActivity(intent)
      } else {
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        reactContext.startActivity(intent)
      }
      true
    } catch (_: ActivityNotFoundException) {
      false
    }
  }
}
