package com.tempo.timerapp.widget

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

/**
 * Bridge between JS and the home-screen widget.
 *
 * `setStats` writes today's numbers into SharedPreferences and broadcasts a
 * refresh so the widget re-renders right away. Called from
 * `src/widget/widgetBridge.ts` whenever the stats store changes.
 */
class TempoWidgetModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = NAME

    @ReactMethod
    fun setStats(focusMs: Double, sessions: Int, streak: Int, promise: Promise) {
        try {
            val prefs = reactContext.getSharedPreferences(
                TempoWidgetProvider.SHARED_PREFS,
                Context.MODE_PRIVATE
            )
            prefs.edit()
                .putLong("todayFocusMs", focusMs.toLong())
                .putInt("todaySessions", sessions)
                .putInt("streak", streak)
                .apply()

            val intent = Intent(reactContext, TempoWidgetProvider::class.java).apply {
                action = TempoWidgetProvider.ACTION_REFRESH
            }
            reactContext.sendBroadcast(intent)

            // Force-update any installed widget instances directly too.
            val mgr = AppWidgetManager.getInstance(reactContext)
            val ids = mgr.getAppWidgetIds(
                ComponentName(reactContext, TempoWidgetProvider::class.java)
            )
            if (ids.isNotEmpty()) {
                val updateIntent = Intent(AppWidgetManager.ACTION_APPWIDGET_UPDATE).apply {
                    putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
                    component = ComponentName(reactContext, TempoWidgetProvider::class.java)
                }
                reactContext.sendBroadcast(updateIntent)
            }
            promise.resolve(true)
        } catch (t: Throwable) {
            promise.reject("WIDGET_SET_STATS_FAILED", t.message, t)
        }
    }

    companion object {
        const val NAME = "TempoWidget"
    }
}
