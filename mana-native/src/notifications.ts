import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from './lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
});

export async function registerNativePush() {
  if (!Device.isDevice) throw new Error('برای Push باید روی گوشی واقعی تست شود.');

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('missions', {
      name: 'ماموریت‌های مانا',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 150, 250],
      sound: 'default'
    });
  }

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') status = (await Notifications.requestPermissionsAsync()).status;
  if (status !== 'granted') throw new Error('اجازه نوتیفیکیشن داده نشد.');

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) throw new Error('شناسه Build مانا هنوز ثبت نشده است.');

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error('ابتدا وارد مانا شوید.');

  const { error } = await supabase.from('df_native_push_tokens').upsert(
    {
      user_id: user.id,
      expo_push_token: token,
      platform: Platform.OS,
      device_name: Device.deviceName || null,
      active: true,
      updated_at: new Date().toISOString()
    },
    { onConflict: 'expo_push_token' }
  );
  if (error) throw error;
  return token;
}