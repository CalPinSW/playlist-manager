import WidgetKit
import SwiftUI
import AppIntents

// MARK: - App Group + Keys (must match WidgetBridgeModule.swift)

private let kAppGroup      = "group.com.calum.playlistmanager"
private let kNowPlayingKey = "widget_now_playing"
private let kAuthTokenKey  = "widget_auth_token"

// MARK: - Data model

struct NowPlayingEntry: TimelineEntry {
  let date:       Date
  let albumId:    String
  let albumName:  String
  let artistName: String
  /// Local file path written by the native bridge. Nil = not yet downloaded.
  let artPath:    String?
  let rating:     Int    // 0 = unrated, 1–5
  let isPlaying:  Bool
}

extension NowPlayingEntry {
  static let placeholder = NowPlayingEntry(
    date:       Date(),
    albumId:    "placeholder",
    albumName:  "Album Title",
    artistName: "Artist Name",
    artPath:    nil,
    rating:     3,
    isPlaying:  true
  )

  static let empty = NowPlayingEntry(
    date:       Date(),
    albumId:    "",
    albumName:  "",
    artistName: "",
    artPath:    nil,
    rating:     0,
    isPlaying:  false
  )

  var hasAlbum: Bool { !albumId.isEmpty }
}

// MARK: - Timeline provider

struct NowPlayingProvider: TimelineProvider {

  func placeholder(in context: Context) -> NowPlayingEntry {
    .placeholder
  }

  func getSnapshot(in context: Context, completion: @escaping (NowPlayingEntry) -> Void) {
    completion(readEntry())
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<NowPlayingEntry>) -> Void) {
    let entry = readEntry()
    // Policy .never — the JS bridge calls reloadAllTimelines() to drive updates.
    // iOS will still opportunistically refresh, but we don't rely on a schedule.
    completion(Timeline(entries: [entry], policy: .never))
  }

  // ── Read from App Group UserDefaults ───────────────────────────────────────

  private func readEntry() -> NowPlayingEntry {
    guard
      let defaults = UserDefaults(suiteName: kAppGroup),
      let data = defaults.data(forKey: kNowPlayingKey),
      let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    else {
      return .empty
    }

    return NowPlayingEntry(
      date:       Date(),
      albumId:    json["albumId"]    as? String ?? "",
      albumName:  json["albumName"]  as? String ?? "",
      artistName: json["artistName"] as? String ?? "",
      artPath:    json["artPath"]    as? String,
      rating:     json["rating"]     as? Int    ?? 0,
      isPlaying:  json["isPlaying"]  as? Bool   ?? false
    )
  }
}

// MARK: - App Intent (iOS 17+ interactive rating)

@available(iOS 17.0, *)
struct SetRatingIntent: AppIntent {
  static var title: LocalizedStringResource = "Rate Album"
  static var description = IntentDescription("Set a star rating for the current album.")

  @Parameter(title: "Album ID") var albumId: String
  @Parameter(title: "Rating")   var rating:  Int

  init() { albumId = ""; rating = 0 }
  init(albumId: String, rating: Int) { self.albumId = albumId; self.rating = rating }

  func perform() async throws -> some IntentResult {
    guard let token = readToken() else {
      throw NSError(domain: "Widget", code: 401,
                    userInfo: [NSLocalizedDescriptionKey: "No auth token — open app to log in"])
    }

    let baseURL = "https://playlist-manager-calums-projects-8679c2fb.vercel.app"
    guard let url = URL(string: "\(baseURL)/api/ratings") else {
      throw NSError(domain: "Widget", code: 400, userInfo: nil)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
    // API uses 1–10 (half-star scale). Widget uses 1–5 (full-star). Multiply by 2.
    let body: [String: Any] = ["albumId": albumId, "rating": rating * 2]
    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (_, response) = try await URLSession.shared.data(for: request)
    guard (response as? HTTPURLResponse)?.statusCode == 200 else {
      throw NSError(domain: "Widget", code: 500,
                    userInfo: [NSLocalizedDescriptionKey: "Rating API call failed"])
    }

    // Update UserDefaults so the widget reflects the new rating immediately.
    if let defaults = UserDefaults(suiteName: kAppGroup),
       let existingData = defaults.data(forKey: kNowPlayingKey),
       var json = try? JSONSerialization.jsonObject(with: existingData) as? [String: Any] {
      json["rating"] = rating
      if let updated = try? JSONSerialization.data(withJSONObject: json) {
        defaults.set(updated, forKey: kNowPlayingKey)
      }
    }

    WidgetCenter.shared.reloadAllTimelines()
    return .result()
  }

  // ── Read Vercel JWT from App Group UserDefaults ───────────────────────────

  private func readToken() -> String? {
    UserDefaults(suiteName: kAppGroup)?.string(forKey: kAuthTokenKey)
  }
}

// MARK: - Shared sub-views

/// Album art loaded from a local file path cached by WidgetBridgeModule.
struct ArtView: View {
  let path: String?
  let size: CGFloat

  var body: some View {
    Group {
      if let path, let uiImage = UIImage(contentsOfFile: path) {
        Image(uiImage: uiImage)
          .resizable()
          .scaledToFill()
      } else {
        ZStack {
          Color(red: 0.10, green: 0.06, blue: 0.18)
          Image(systemName: "music.note")
            .font(.system(size: size * 0.28))
            .foregroundColor(Color(white: 1, opacity: 0.15))
        }
      }
    }
    .frame(width: size, height: size)
    .clipped()
  }
}

/// Five tappable star chips — interactive on iOS 17+, display-only on older.
struct StarRatingView: View {
  let albumId: String
  let rating:  Int   // 0 = unrated, 1–5
  let chipSize: CGFloat

  var body: some View {
    HStack(spacing: 3) {
      ForEach(1...5, id: \.self) { star in
        starChip(star: star)
      }
    }
  }

  @ViewBuilder
  private func starChip(star: Int) -> some View {
    let filled = star <= rating
    if #available(iOS 17.0, *) {
      Button(intent: SetRatingIntent(albumId: albumId, rating: star)) {
        chipBody(filled: filled)
      }
      .buttonStyle(.plain)
    } else {
      chipBody(filled: filled)
    }
  }

  private func chipBody(filled: Bool) -> some View {
    ZStack {
      RoundedRectangle(cornerRadius: 6)
        .fill(filled
          ? Color(red: 0.51, green: 0.24, blue: 1.0).opacity(0.45)
          : Color(red: 0.18, green: 0.12, blue: 0.37).opacity(0.7))
      Text(filled ? "★" : "☆")
        .font(.system(size: chipSize))
        .foregroundColor(filled
          ? Color(red: 0.70, green: 0.52, blue: 1.0)
          : Color(red: 0.35, green: 0.28, blue: 0.55))
    }
    .frame(width: chipSize + 10, height: chipSize + 8)
  }
}

// MARK: - Small widget (S1 — Glass Shelf)

struct SmallWidgetView: View {
  let entry: NowPlayingEntry

  var body: some View {
    if entry.hasAlbum {
      playingView
    } else {
      emptyView
    }
  }

  private var playingView: some View {
    ZStack(alignment: .bottom) {
      ArtView(path: entry.artPath, size: 170)
        .frame(maxWidth: .infinity, maxHeight: .infinity)

      // Frosted glass footer
      VStack(alignment: .leading, spacing: 2) {
        Text(entry.albumName)
          .font(.system(size: 11.5, weight: .bold))
          .foregroundColor(.white)
          .lineLimit(1)

        Text(entry.artistName)
          .font(.system(size: 9.5))
          .foregroundColor(Color(white: 1, opacity: 0.55))
          .lineLimit(1)

        Spacer().frame(height: 4)

        StarRatingView(albumId: entry.albumId, rating: entry.rating, chipSize: 11)
      }
      .padding(.horizontal, 10)
      .padding(.vertical, 10)
      .frame(maxWidth: .infinity, alignment: .leading)
      .background(
        LinearGradient(
          colors: [
            Color(red: 0.04, green: 0.02, blue: 0.09).opacity(0.97),
            Color(red: 0.04, green: 0.02, blue: 0.09).opacity(0.85),
            Color.clear
          ],
          startPoint: .bottom,
          endPoint: .top
        )
      )
      .background(.ultraThinMaterial.opacity(0.5))
    }
    .widgetURL(URL(string: "playlistmanager://album/\(entry.albumId)"))
  }

  private var emptyView: some View {
    ZStack {
      Color(red: 0.063, green: 0.035, blue: 0.118)
      VStack(spacing: 6) {
        Image(systemName: "music.note")
          .font(.system(size: 24))
          .foregroundColor(Color(white: 1, opacity: 0.2))
        Text("Nothing\nplaying")
          .font(.system(size: 10))
          .foregroundColor(Color(white: 1, opacity: 0.2))
          .multilineTextAlignment(.center)
      }
    }
  }
}

// MARK: - Medium widget (M1 — Art left + info + chips right)

struct MediumWidgetView: View {
  let entry: NowPlayingEntry

  private let surface   = Color(red: 0.063, green: 0.035, blue: 0.118)
  private let textMuted = Color(red: 0.61,  green: 0.56,  blue: 0.77)
  private let green     = Color(red: 0.47,  green: 0.65,  blue: 0.24)

  var body: some View {
    if entry.hasAlbum {
      playingView
    } else {
      emptyView
    }
  }

  private var playingView: some View {
    HStack(spacing: 0) {
      // Square album art fills left column
      ArtView(path: entry.artPath, size: 170)

      // Right column
      VStack(alignment: .leading, spacing: 0) {
        // "Now Playing" / "Last Played" badge
        HStack(spacing: 4) {
          Circle()
            .fill(entry.isPlaying ? green : Color.clear)
            .frame(width: 5, height: 5)
            .shadow(color: entry.isPlaying ? green : .clear, radius: 3)
          Text(entry.isPlaying ? "NOW PLAYING" : "LAST PLAYED")
            .font(.system(size: 8.5, weight: .bold))
            .foregroundColor(entry.isPlaying ? green : textMuted)
            .tracking(0.8)
        }
        .padding(.bottom, 6)

        Text(entry.albumName)
          .font(.system(size: 14, weight: .heavy))
          .foregroundColor(.white)
          .lineLimit(2)
          .fixedSize(horizontal: false, vertical: true)

        Text(entry.artistName)
          .font(.system(size: 11))
          .foregroundColor(textMuted)
          .lineLimit(1)
          .padding(.top, 2)

        Spacer()

        VStack(alignment: .leading, spacing: 5) {
          Text("RATE")
            .font(.system(size: 8.5, weight: .bold))
            .foregroundColor(Color(white: 1, opacity: 0.2))
            .tracking(1)

          StarRatingView(albumId: entry.albumId, rating: entry.rating, chipSize: 13)
        }
      }
      .padding(14)
      .frame(maxHeight: .infinity, alignment: .topLeading)
      .background(surface)
    }
    .widgetURL(URL(string: "playlistmanager://album/\(entry.albumId)"))
  }

  private var emptyView: some View {
    ZStack {
      surface
      HStack(spacing: 14) {
        Image(systemName: "music.note")
          .font(.system(size: 28))
          .foregroundColor(Color(white: 1, opacity: 0.12))
        VStack(alignment: .leading, spacing: 4) {
          Text("Nothing playing")
            .font(.system(size: 13, weight: .semibold))
            .foregroundColor(Color(white: 1, opacity: 0.2))
          Text("Open Spotify to get started")
            .font(.system(size: 11))
            .foregroundColor(Color(white: 1, opacity: 0.12))
        }
      }
    }
  }
}

// MARK: - Widget definition

struct PlaylistManagerWidget: Widget {
  let kind = "PlaylistManagerWidget"

  var body: some WidgetConfiguration {
    StaticConfiguration(kind: kind, provider: NowPlayingProvider()) { entry in
      PlaylistManagerWidgetEntryView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
    }
    .configurationDisplayName("Now Playing")
    .description("See what album is playing and rate it from your Home Screen.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}

struct PlaylistManagerWidgetEntryView: View {
  @Environment(\.widgetFamily) var family
  let entry: NowPlayingEntry

  var body: some View {
    switch family {
    case .systemSmall:  SmallWidgetView(entry: entry)
    case .systemMedium: MediumWidgetView(entry: entry)
    default:            SmallWidgetView(entry: entry)
    }
  }
}

// MARK: - Entry point

@main
struct PlaylistManagerWidgetBundle: WidgetBundle {
  var body: some Widget {
    PlaylistManagerWidget()
  }
}
