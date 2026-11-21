import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_URL) ||
  'https://dgxazfysfndkddljkpaz.supabase.co';
const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_SUPABASE_ANON_KEY) ||
  'sb_publishable_d0gLIMmOx2c3oX1c90KKZw_F-7KZ_Wi';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

