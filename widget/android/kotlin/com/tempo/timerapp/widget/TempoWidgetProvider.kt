package com.tempo.timerapp.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.net.Uri
import android.widget.RemoteViews

/**
 * Tempo home-screen widget.
 *
 * Reads today's focus stats from SharedPreferences (written by the JS side via
 * a small bridge — see `src/widget/widgetBridge.ts`). When the user taps a
 * button, we deep-link back into the app via the `timerapp://` scheme (declared
 * in app.json). No user data leaves the device.
 */
class TempoWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        appWidgetIds.forEach { id -> renderWidget(context, appWidgetManager, id) }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_REFRESH) {
            val mgr = AppWidgetManager.getInstance(context)
            val ids = mgr.getAppWidgetIds(ComponentName(context, TempoWidgetProvider::class.java))
            ids.forEach { id -> renderWidget(context, mgr, id) }
        }
    }

    private fun renderWidget(
        context: Context,
        manager: AppWidgetManager,
        widgetId: Int
    ) {
        val layoutId = resId(context, "tempo_widget_layout", "layout")
        val views = RemoteViews(context.packageName, layoutId)

        val prefs: SharedPreferences = context.getSharedPreferences(SHARED_PREFS, Context.MODE_PRIVATE)
        val focusMs = prefs.getLong("todayFocusMs", 0L)
        val streak = prefs.getInt("streak", 0)
        val sessions = prefs.getInt("todaySessions", 0)

        views.setTextViewText(idOf(context, "tempo_widget_time"), formatHuman(focusMs))
        views.setTextViewText(idOf(context, "tempo_widget_label"), labelFor(focusMs, sessions))
        views.setTextViewText(idOf(context, "tempo_widget_streak"), "${streak}d")

        views.setOnClickPendingIntent(
            idOf(context, "tempo_widget_action_focus"),
            buildDeepLink(context, "timerapp://pomodoro?start=1")
        )
        views.setOnClickPendingIntent(
            idOf(context, "tempo_widget_action_timer"),
            buildDeepLink(context, "timerapp://two")
        )
        views.setOnClickPendingIntent(
            idOf(context, "tempo_widget_root"),
            buildDeepLink(context, "timerapp://")
        )

        manager.updateAppWidget(widgetId, views)
    }

    private fun buildDeepLink(context: Context, uri: String): PendingIntent {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        return PendingIntent.getActivity(
            context,
            uri.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
    }

    private fun formatHuman(ms: Long): String {
        if (ms <= 0L) return "0m"
        val totalMin = (ms / 60_000L).toInt()
        val hours = totalMin / 60
        val mins = totalMin % 60
        return if (hours > 0) "${hours}h ${mins}m" else "${mins}m"
    }

    private fun labelFor(ms: Long, sessions: Int): String =
        if (ms <= 0L) "Tap Focus to begin"
        else "$sessions session${if (sessions == 1) "" else "s"} today"

    private fun resId(ctx: Context, name: String, type: String): Int =
        ctx.resources.getIdentifier(name, type, ctx.packageName)

    private fun idOf(ctx: Context, name: String): Int = resId(ctx, name, "id")

    companion object {
        const val SHARED_PREFS = "TempoWidgetState"
        const val ACTION_REFRESH = "com.tempo.timerapp.widget.REFRESH"
    }
}
