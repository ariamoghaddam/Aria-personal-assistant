export default {
  expo: {
    name: 'مانا',
    slug: 'mana-field',
    scheme: 'mana',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'automatic',
    android: {
      package: 'com.darisazma.mana',
      permissions: [
        'ACCESS_FINE_LOCATION',
        'ACCESS_COARSE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION',
        'POST_NOTIFICATIONS'
      ]
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.darisazma.mana',
      infoPlist: {
        NSLocationWhenInUseUsageDescription: 'برای ثبت حضور و مسیر مأموریت، مانا به موقعیت مکانی نیاز دارد.',
        NSLocationAlwaysAndWhenInUseUsageDescription: 'در زمان مأموریت فعال، مانا موقعیت را در پس‌زمینه ثبت می‌کند.',
        UIBackgroundModes: ['location', 'remote-notification']
      }
    },
    plugins: [
      ['expo-notifications', { color: '#0B3045', defaultChannel: 'missions', enableBackgroundRemoteNotifications: true }],
      ['expo-location', {
        locationWhenInUsePermission: 'مانا برای ثبت مأموریت به موقعیت مکانی شما نیاز دارد.',
        locationAlwaysAndWhenInUsePermission: 'مانا فقط در زمان مأموریت فعال، موقعیت را در پس‌زمینه ثبت می‌کند.',
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true
      }]
    ],
    extra: {
      supabaseUrl: 'https://ifuyhkbueumvdjlxlodo.supabase.co',
      supabasePublishableKey: 'sb_publishable_xJQ12RwCufktVD9bOtKSoQ_MVh4IwZz',
      eas: { projectId: process.env.EXPO_PROJECT_ID || '' }
    }
  }
};