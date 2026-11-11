import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let steadierToday = Self("Steadier.Today")
}

@main
struct SteadierReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TodayReport { configuration in
      VStack(alignment: .leading, spacing: 12) {
        Text("Screen Time today").font(.headline)
        Text(configuration).font(.largeTitle.bold())
        Text("Reported by iOS for authorized iPhone usage. Updates may be delayed.")
          .font(.caption).foregroundStyle(.secondary)
      }.padding().frame(maxWidth: .infinity, alignment: .leading)
    }
  }
}

struct TodayReport: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .steadierToday
  let content: (String) -> ReportContent
  typealias ReportContent = AnyView
  init(@ViewBuilder content: @escaping (String) -> some View) {
    self.content = { AnyView(content($0)) }
  }
  func makeConfiguration(representing data: DeviceActivityResults<DeviceActivityData>) async -> String {
    var duration: TimeInterval = 0
    var received = false
    for await activity in data {
      for await segment in activity.activitySegments {
        received = true
        duration += segment.totalActivityDuration
      }
    }
    guard received else { return "No report available yet" }
    let minutes = Int(duration / 60)
    return "\(minutes / 60)h \(minutes % 60)m"
  }
}
