import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kacrakipsprtzgrtplbz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImthY3Jha2lwc3BydHpncnRwbGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NjU1MDIsImV4cCI6MjA4OTU0MTUwMn0._mxh9N8guoAzDjhmrpZDxugA2YpNxuZZf_gzvzZ6TRc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
