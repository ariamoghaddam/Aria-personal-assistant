import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export const LOCATION_TASK = 'MANA_ACTIVE_MISSION_LOCATION';
const ACTIVE_MISSION_KEY = 'mana.activeMissionId';

TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) return;
  const missionId = await AsyncStorage.getItem(ACTIVE_MISSION_KEY);
  if (!missionId) return;
  const payload = data as { locations?: Location.LocationObject[] };
  const location = payload.locations?.[payload.locations.length - 1];
  if (!location) return;

  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) return;

  const row = {
    mission_id: missionId,
    technician_id: user.id,
    lat: location.coords.latitude,
    lng: location.coords.longitude,
    accuracy_m: location.coords.accuracy,
    speed_mps: location.coords.speed,
    heading_deg: location.coords.heading,
    recorded_at: new Date(location.timestamp).toISOString()
  };

  await supabase.from('df_location_points').insert(row);
  await supabase.from('df_missions').update({
    last_lat: row.lat,
    last_lng: row.lng,
    last_location_at: row.recorded_at
  }).eq('id', missionId);
});

export async function startMissionLocation(missionId: string) {
  const fg = await Location.requestForegroundPermissionsAsync();
  if (fg.status !== 'granted') throw new Error('اجازه GPS داده نشد.');
  const bg = await Location.requestBackgroundPermissionsAsync();
  if (bg.status !== 'granted') throw new Error('اجازه GPS پس‌زمینه داده نشد.');

  await AsyncStorage.setItem(ACTIVE_MISSION_KEY, missionId);
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 15000,
      distanceInterval: 20,
      pausesUpdatesAutomatically: false,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'ماموریت مانا فعال است',
        notificationBody: 'موقعیت فقط تا پایان این مأموریت ثبت می‌شود.'
      }
    });
  }
}

export async function stopMissionLocation() {
  const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK);
  if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK);
  await AsyncStorage.removeItem(ACTIVE_MISSION_KEY);
}