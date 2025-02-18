import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://fozfalhclroaohxgnibf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvemZhbGhjbHJvYW9oeGduaWJmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4NjMyMjMsImV4cCI6MjA1NTQzOTIyM30.VTRrEq0nAxoU8jqvB4AI8vIuH7X_nLNBQNFnqRfatgI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default supabase;
