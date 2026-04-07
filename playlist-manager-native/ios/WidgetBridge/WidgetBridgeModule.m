#import <React/RCTBridgeModule.h>

// Expose the Swift module to the React Native bridge.
// Method signatures must exactly match the @objc declarations in the Swift file.

@interface RCT_EXTERN_MODULE(WidgetBridgeModule, NSObject)

RCT_EXTERN_METHOD(
  writeNowPlaying:(NSString *)albumId
  albumName:(NSString *)albumName
  artistName:(NSString *)artistName
  imageUrl:(NSString *)imageUrl
  rating:(nonnull NSNumber *)rating
  isPlaying:(BOOL)isPlaying
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

RCT_EXTERN_METHOD(
  writeAuthToken:(NSString *)token
  resolve:(RCTPromiseResolveBlock)resolve
  reject:(RCTPromiseRejectBlock)reject
)

@end
