import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const url = 'https://ifuyhkbueumvdjlxlodo.supabase.co';
const key = 'sb_publishable_xJQ12RwCufktVD9bOtKSoQ_MVh4IwZz';

export const supabase = createClient(url, key, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  }
});