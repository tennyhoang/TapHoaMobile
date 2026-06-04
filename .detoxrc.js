/** @type {import('detox').DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },
  apps: {
    'ios.debug': {
      type: 'ios.app',
      build:
        'npx expo run:ios --configuration Debug --scheme TapHoaMobile',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/TapHoaMobile.app',
    },
    'ios.release': {
      type: 'ios.app',
      build:
        'npx expo run:ios --configuration Release --scheme TapHoaMobile',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/TapHoaMobile.app',
    },
    'android.debug': {
      type: 'android.apk',
      build:
        'npx expo run:android --variant Debug',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
    },
    'android.release': {
      type: 'android.apk',
      build:
        'npx expo run:android --variant Release',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
    },
  },
  devices: {
    simulator: {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 16',
      },
    },
    emulator: {
      type: 'android.emulator',
      device: {
        avdName: 'Pixel_6_API_35',
      },
    },
  },
  configurations: {
    'ios.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'android.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
