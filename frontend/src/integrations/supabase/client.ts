import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://stxrccnzyvuulsadjuob.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0eHJjY256eXZ1dWxzYWRqdW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5OTQ1MDQsImV4cCI6MjA2OTU3MDUwNH0.HTMagpoGKUUPxq04O0MbpV7npgnFRdX30mnQ0K2_gNI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);