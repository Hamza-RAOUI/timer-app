//
// TempoWidget.swift
//
// Tempo home-screen widget for iOS (WidgetKit + SwiftUI).
//
// Reads today's focus stats from a shared App Group UserDefaults
// (group.com.tempo.timerapp). The JS side writes to that store via
// `src/widget/widgetBridge.ts`.
//

import WidgetKit
import SwiftUI

private let APP_GROUP = "group.com.tempo.timerapp"

struct TempoEntry: TimelineEntry {
    let date: Date
    let focusMs: Int64
    let sessions: Int
    let streak: Int
}

struct TempoProvider: TimelineProvider {
    func placeholder(in context: Context) -> TempoEntry {
        TempoEntry(date: Date(), focusMs: 0, sessions: 0, streak: 0)
    }

    func getSnapshot(in context: Context, completion: @escaping (TempoEntry) -> Void) {
        completion(load())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<TempoEntry>) -> Void) {
        let entry = load()
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }

    private func load() -> TempoEntry {
        let defaults = UserDefaults(suiteName: APP_GROUP)
        let focusMs = defaults?.object(forKey: "todayFocusMs") as? Int64 ?? 0
        let sessions = defaults?.integer(forKey: "todaySessions") ?? 0
        let streak = defaults?.integer(forKey: "streak") ?? 0
        return TempoEntry(date: Date(), focusMs: focusMs, sessions: sessions, streak: streak)
    }
}

struct TempoWidgetEntryView: View {
    var entry: TempoProvider.Entry

    var body: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.067, green: 0.078, blue: 0.165),
                    Color(red: 0.043, green: 0.055, blue: 0.102),
                    Color(red: 0.024, green: 0.027, blue: 0.051)
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )

            // Soft accent orb
            Circle()
                .fill(Color(red: 0.49, green: 0.83, blue: 0.99))
                .frame(width: 140, height: 140)
                .blur(radius: 60)
                .opacity(0.28)
                .offset(x: 70, y: -50)

            VStack(alignment: .leading, spacing: 6) {
                HStack(alignment: .center) {
                    Text("TEMPO")
                        .font(.system(size: 10, weight: .heavy))
                        .tracking(2)
                        .foregroundColor(Color(red: 0.49, green: 0.83, blue: 0.99))
                    Spacer()
                    HStack(spacing: 4) {
                        Image(systemName: "flame.fill")
                            .font(.system(size: 10))
                            .foregroundColor(Color(red: 0.98, green: 0.45, blue: 0.52))
                        Text("\(entry.streak)d")
                            .font(.system(size: 11, weight: .semibold))
                            .foregroundColor(Color(red: 0.65, green: 0.69, blue: 0.78))
                    }
                }

                Text(formatHuman(entry.focusMs))
                    .font(.system(size: 30, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundColor(.white)
                    .padding(.top, 2)

                Text(label(for: entry))
                    .font(.system(size: 11))
                    .foregroundColor(Color(red: 0.65, green: 0.69, blue: 0.78))

                Spacer()

                HStack(spacing: 8) {
                    Link(destination: URL(string: "timerapp://pomodoro?start=1")!) {
                        Text("Focus")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundColor(Color(red: 0.043, green: 0.055, blue: 0.102))
                            .frame(maxWidth: .infinity)
                            .frame(height: 30)
                            .background(
                                LinearGradient(
                                    colors: [
                                        Color(red: 0.49, green: 0.83, blue: 0.99),
                                        Color(red: 0.22, green: 0.74, blue: 0.97)
                                    ],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                    Link(destination: URL(string: "timerapp://two")!) {
                        Text("Timer")
                            .font(.system(size: 12, weight: .heavy))
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .frame(height: 30)
                            .background(Color.white.opacity(0.06))
                            .overlay(
                                RoundedRectangle(cornerRadius: 12)
                                    .strokeBorder(Color.white.opacity(0.10), lineWidth: 1)
                            )
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .padding(14)
        }
        .widgetURL(URL(string: "timerapp://"))
    }

    private func formatHuman(_ ms: Int64) -> String {
        guard ms > 0 else { return "0m" }
        let totalMin = Int(ms / 60_000)
        let h = totalMin / 60
        let m = totalMin % 60
        return h > 0 ? "\(h)h \(m)m" : "\(m)m"
    }

    private func label(for entry: TempoEntry) -> String {
        if entry.focusMs <= 0 { return "Tap Focus to begin" }
        return "\(entry.sessions) session\(entry.sessions == 1 ? "" : "s") today"
    }
}

@main
struct TempoWidget: Widget {
    let kind: String = "TempoWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: TempoProvider()) { entry in
            if #available(iOS 17.0, *) {
                TempoWidgetEntryView(entry: entry)
                    .containerBackground(.clear, for: .widget)
            } else {
                TempoWidgetEntryView(entry: entry)
            }
        }
        .configurationDisplayName("Tempo")
        .description("Today's focus and quick start.")
        .supportedFamilies([.systemSmall, .systemMedium])
        .contentMarginsDisabled()
    }
}

#Preview(as: .systemSmall) {
    TempoWidget()
} timeline: {
    TempoEntry(date: .now, focusMs: 75 * 60 * 1000, sessions: 3, streak: 4)
}
