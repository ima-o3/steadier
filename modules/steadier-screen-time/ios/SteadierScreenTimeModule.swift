import ExpoModulesCore
import FamilyControls

public class SteadierScreenTimeModule: Module {
  public func definition() -> ModuleDefinition {
    Name("SteadierScreenTime")
    View(SteadierScreenTimeView.self) {}
    AsyncFunction("authorizationStatus") { () -> String in
      switch AuthorizationCenter.shared.authorizationStatus {
      case .approved: return "approved"
      case .denied: return "denied"
      case .notDetermined: return "notDetermined"
      @unknown default: return "unknown"
      }
    }.runOnQueue(.main)
    AsyncFunction("requestAuthorization") { () async throws -> String in
      try await AuthorizationCenter.shared.requestAuthorization(for: .individual)
      return AuthorizationCenter.shared.authorizationStatus == .approved ? "approved" : "denied"
    }.runOnQueue(.main)
  }
}

