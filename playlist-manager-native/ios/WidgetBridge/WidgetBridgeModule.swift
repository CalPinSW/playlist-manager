import Foundation
import WidgetKit

/// App Group identifier — must match app.json and the widget extension target.
private let kAppGroup = "group.com.calum.playlistmanager"

/// UserDefaults key for now-playing JSON.
private let kNowPlayingKey = "widget_now_playing"

/// Keychain service name for the Vercel auth token.
private let kKeychainService = "com.calum.playlistmanager.widget"
private let kKeychainAccount = "vercel_jwt"

// MARK: - Objective-C bridge

@objc(WidgetBridgeModule)
class WidgetBridgeModule: NSObject {

  // ── RCT export ──────────────────────────────────────────────────────────────

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // ── writeNowPlaying ─────────────────────────────────────────────────────────

  /// Writes album metadata + cached art path to App Group UserDefaults,
  /// then reloads all WidgetKit timelines.
  ///
  /// albumId      — Spotify album ID (used as a change key for deduplication)
  /// albumName    — Display name
  /// artistName   — Primary artist
  /// imageUrl     — Remote https:// URL for album art; downloaded & cached here
  /// rating       — Integer 1–5, or 0 for unrated
  /// isPlaying    — Whether Spotify is actively playing this album right now
  @objc func writeNowPlaying(
    _ albumId: String,
    albumName: String,
    artistName: String,
    imageUrl: String,
    rating: Int,
    isPlaying: Bool,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      do {
        // Download + cache album art to App Group container.
        let artPath = try await downloadAndCacheArt(imageUrl: imageUrl, albumId: albumId)

        let payload: [String: Any] = [
          "albumId":    albumId,
          "albumName":  albumName,
          "artistName": artistName,
          "artPath":    artPath,      // local file:// path readable by widget
          "rating":     rating,
          "isPlaying":  isPlaying,
          "updatedAt":  Date().timeIntervalSince1970
        ]

        guard let data = try? JSONSerialization.data(withJSONObject: payload),
              let defaults = UserDefaults(suiteName: kAppGroup) else {
          reject("WIDGET_BRIDGE_ERROR", "Failed to serialise payload or open App Group", nil)
          return
        }

        defaults.set(data, forKey: kNowPlayingKey)

        // Tell WidgetKit the timeline is stale — it will re-read UserDefaults.
        if #available(iOS 14.0, *) {
          WidgetCenter.shared.reloadAllTimelines()
        }

        resolve(nil)
      } catch {
        reject("WIDGET_BRIDGE_ERROR", error.localizedDescription, error)
      }
    }
  }

  // ── writeAuthToken ───────────────────────────────────────────────────────────

  /// Stores the Vercel JWT in the App Group Keychain so the widget extension's
  /// SetRatingIntent can make authenticated API calls.
  @objc func writeAuthToken(
    _ token: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    let tokenData = Data(token.utf8)

    // Build a Keychain query with the App Group access group.
    var query: [String: Any] = [
      kSecClass as String:            kSecClassGenericPassword,
      kSecAttrService as String:      kKeychainService,
      kSecAttrAccount as String:      kKeychainAccount,
      kSecAttrAccessGroup as String:  kAppGroup,
    ]

    // Try to update first; if nothing exists, add.
    let updateAttrs: [String: Any] = [kSecValueData as String: tokenData]
    var status = SecItemUpdate(query as CFDictionary, updateAttrs as CFDictionary)

    if status == errSecItemNotFound {
      query[kSecValueData as String] = tokenData
      status = SecItemAdd(query as CFDictionary, nil)
    }

    if status == errSecSuccess {
      resolve(nil)
    } else {
      reject("KEYCHAIN_ERROR", "SecItem error \(status)", nil)
    }
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /// Downloads album art and saves it to the App Group container.
  /// Returns the local file path. Re-uses cached file if it already exists.
  private func downloadAndCacheArt(imageUrl: String, albumId: String) async throws -> String {
    guard let containerURL = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: kAppGroup) else {
      throw NSError(domain: "WidgetBridge", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "App Group container not found"])
    }

    let artDir = containerURL.appendingPathComponent("art", isDirectory: true)
    try? FileManager.default.createDirectory(at: artDir, withIntermediateDirectories: true)

    let destURL = artDir.appendingPathComponent("\(albumId).jpg")

    // If already cached, return immediately.
    if FileManager.default.fileExists(atPath: destURL.path) {
      return destURL.path
    }

    guard let url = URL(string: imageUrl) else {
      throw NSError(domain: "WidgetBridge", code: 2,
                    userInfo: [NSLocalizedDescriptionKey: "Invalid image URL: \(imageUrl)"])
    }

    let (data, _) = try await URLSession.shared.data(from: url)
    try data.write(to: destURL, options: .atomic)
    return destURL.path
  }
}
