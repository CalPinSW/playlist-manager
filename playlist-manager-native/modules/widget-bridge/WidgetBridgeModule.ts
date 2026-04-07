/**
 * Thin TypeScript shim that imports the native module by name.
 * The actual implementation lives in WidgetBridgeModule.swift.
 *
 * We use NativeModules + a Proxy fallback so the import doesn't crash
 * on Android or in web/Storybook environments.
 */

import { NativeModules, Platform } from 'react-native';

const { WidgetBridgeModule } = NativeModules;

// Return a no-op proxy on unsupported platforms so callers never have to guard.
const noop = () => Promise.resolve();

const stub = new Proxy({} as Record<string, () => Promise<void>>, {
  get: () => noop,
});

export default (Platform.OS === 'ios' && WidgetBridgeModule) ? WidgetBridgeModule : stub;
