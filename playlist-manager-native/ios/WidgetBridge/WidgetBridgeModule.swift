import Foundation
import WidgetKit

/// App Group identifier — must match app.json and the widget extension target.
private let kAppGroup = "group.com.calum.playlistmanager"

/// UserDefaults keys.
private let kNowPlayingKey = "widget_now_playing"
private let kAuthTokenKey  = "widget_auth_token"

// MARK: - Objective-C bridge

@objc(WidgetBridgeModule)
class WidgetBridgeModule: NSObject {

  @objc static func requiresMainQueueSetup() -> Bool { false }

  // ── writeNowPlaying ─────────────────────────────────────────────────────────

  /// Writes album metadata + cached art path to App Group UserDefaults,
  /// then reloads all WidgetKit timelines.
  ///
  /// albumId      — Spotify album ID
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
        let artPath = try await downloadAndCacheArt(imageUrl: imageUrl, albumId: albumId)

        let payload: [String: Any] = [
          "albumId":    albumId,
          "albumName":  albumName,
          "artistName": artistName,
          "artPath":    artPath,
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

  /// Stores the Vercel JWT in App Group UserDefaults so SetRatingIntent
  /// can make authenticated API calls without opening the app.
  /// UserDefaults is sufficient for a personal app; the token is already
  /// in the device's sandbox and this avoids Keychain Sharing entitlements.
  @objc func writeAuthToken(
    _ token: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    guard let defaults = UserDefaults(suiteName: kAppGroup) else {
      reject("WIDGET_BRIDGE_ERROR", "Could not open App Group UserDefaults", nil)
      return
    }
    defaults.set(token, forKey: kAuthTokenKey)
    resolve(nil)
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  private func downloadAndCacheArt(imageUrl: String, albumId: String) async throws -> String {
    guard let containerURL = FileManager.default
      .containerURL(forSecurityApplicationGroupIdentifier: kAppGroup) else {
      throw NSError(domain: "WidgetBridge", code: 1,
                    userInfo: [NSLocalizedDescriptionKey: "App Group container not found"])
    }

    let artDir = containerURL.appendingPathComponent("art", isDirectory: true)
    try? FileManager.default.createDirectory(at: artDir, withIntermediateDirectories: true)

    let destURL = artDir.appendingPathComponent("\(albumId).jpg")

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
