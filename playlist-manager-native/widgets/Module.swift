import ExpoModulesCore

/**
 * Minimal ReactNativeWidgetExtension Expo module.
 *
 * The react-native-widget-extension plugin copies this file into its own
 * ios/ directory and compiles it as part of the ReactNativeWidgetExtension pod.
 * The JS side (build/index.js) calls requireNativeModule("ReactNativeWidgetExtension")
 * which must resolve to a module with these four functions.
 *
 * Playlist Manager does not use Live Activities — all functions are stubs.
 * Widget data is written via WidgetBridgeModule (our own native module) instead.
 */
public class ReactNativeWidgetExtensionModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ReactNativeWidgetExtension")

    Function("areActivitiesEnabled") { () -> Bool in
      return false
    }

    Function("startActivity") { (_: [String: Any]) -> String in
      return ""
    }

    Function("updateActivity") { (_: String, _: [String: Any]) -> Void in }

    Function("endActivity") { (_: String) -> Void in }
  }
}
