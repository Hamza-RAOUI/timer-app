# Tempo Home-Screen Widget

Native widget code that surfaces today's focus stats and quick-launch buttons
on the device home screen — works on both Android (`AppWidgetProvider`) and
iOS (`WidgetKit` + SwiftUI).

```
widget/
├── android/                Kotlin AppWidget + bridge module + resources
├── ios/TempoWidget/        SwiftUI WidgetKit extension + bridge
├── plugin/                 Expo config plugin (auto-injects native files)
└── README.md
```

## How it works

1. JS keeps the source-of-truth stats in `useStatsStore` (AsyncStorage backed).
2. On every change, `src/widget/widgetBridge.ts` calls a tiny native module
   (`TempoWidget.setStats`) which writes today's numbers into a shared store
   (Android `SharedPreferences`, iOS App Group `UserDefaults`).
3. The widget reads from that store and re-renders. Tapping a button deep-links
   back into the app via the `timerapp://` URL scheme.

No data leaves the device.

## Setup

The widget is wired to `expo prebuild` via `withTempoWidget.js`. After running
prebuild, the Android side is fully ready. On iOS, the Swift sources are copied
into `ios/TempoWidget/` but you still need to register the extension target in
Xcode (one-time, ~2 min):

### iOS (one-time)

1. `npx expo prebuild` — copies sources, adds App Group entitlement.
2. Open `ios/Timer_app.xcworkspace` in Xcode.
3. **File → New → Target → Widget Extension** (NOT "Live Activity").
   - Product Name: `TempoWidget`
   - Include Configuration Intent: **off**
4. Xcode will create a stub. Delete its generated `TempoWidget.swift`.
5. Drag the files from `ios/TempoWidget/` (the ones the plugin copied) into the
   new TempoWidget target. **Add to targets: TempoWidget only** (and the bridge
   `.swift` + `.m` files into the **app** target).
6. In *Signing & Capabilities* for both the app target and `TempoWidget`,
   enable **App Groups** and check `group.com.tempo.timerapp`.
7. Build & run — the widget shows up under the gallery as **Tempo**.

### Android

`expo prebuild` does everything:
- Copies XML / drawables / layouts into `res/`.
- Copies Kotlin sources into `android/app/src/main/java/com/tempo/timerapp/widget/`.
- Adds the `<receiver>` declaration to `AndroidManifest.xml`.
- Registers `TempoWidgetPackage()` in `MainApplication.kt`.

After install, long-press the home screen → Widgets → **Tempo**.

## Customizing

| Item | Where |
|---|---|
| Colors / gradient | `widget/android/res/drawable/*.xml` and the `LinearGradient` in `TempoWidget.swift` |
| Layout / sizing | `tempo_widget_layout.xml` (Android) and `TempoWidgetEntryView` (iOS) |
| Refresh cadence | `updatePeriodMillis` in `tempo_widget_info.xml` and `Timeline(after:)` in `TempoProvider` |
| Deep-link routes | `buildDeepLink(...)` calls in `TempoWidgetProvider.kt` and `Link(destination:)` in `TempoWidget.swift` |
| Bundle / app group ID | `TempoWidget.swift` (`APP_GROUP`), `TempoWidget.entitlements`, `withTempoWidget.js` |

## Local-only test (no widget host)

If you can't install the widget yet but want to verify the JS bridge works,
`src/widget/widgetBridge.ts` no-ops on web and Expo Go and silently swallows
errors — safe to leave the call site in place.
