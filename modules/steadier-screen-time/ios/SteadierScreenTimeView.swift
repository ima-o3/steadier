import ExpoModulesCore
import SwiftUI
import DeviceActivity

struct SteadierUsageReport: View {
  let filter = DeviceActivityFilter(
    segment: .daily(during: Calendar.current.dateInterval(of: .day, for: Date())!),
    users: .all,
    devices: .init([.iPhone])
  )
  var body: some View {
    DeviceActivityReport(.init("Steadier.Today"), filter: filter)
  }
}

final class SteadierScreenTimeView: ExpoView {
  private let hosting = UIHostingController(rootView: SteadierUsageReport())
  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    hosting.view.backgroundColor = .clear
    addSubview(hosting.view)
    clipsToBounds = true
  }
  override func layoutSubviews() {
    super.layoutSubviews()
    hosting.view.frame = bounds
  }
}
