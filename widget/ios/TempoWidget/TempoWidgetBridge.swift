//
//  TempoWidgetBridge.swift
//
//  Native module exposed to React Native as `TempoWidget`.
//  Writes today's stats into the shared App Group and reloads the widget
//  timeline. Mirror the Android implementation in TempoWidgetModule.kt.
//

import Foundation
import WidgetKit

@objc(TempoWidget)
class TempoWidgetBridge: NSObject {

    @objc static func requiresMainQueueSetup() -> Bool { false }

    @objc(setStats:sessions:streak:resolver:rejecter:)
    func setStats(
        focusMs: NSNumber,
        sessions: NSNumber,
        streak: NSNumber,
        resolve: RCTPromiseResolveBlock,
        reject: RCTPromiseRejectBlock
    ) {
        guard let defaults = UserDefaults(suiteName: "group.com.tempo.timerapp") else {
            reject("WIDGET_NO_GROUP", "Missing App Group", nil)
            return
        }
        defaults.set(Int64(truncating: focusMs), forKey: "todayFocusMs")
        defaults.set(sessions.intValue, forKey: "todaySessions")
        defaults.set(streak.intValue, forKey: "streak")
        defaults.synchronize()

        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadTimelines(ofKind: "TempoWidget")
        }
        resolve(true)
    }
}
