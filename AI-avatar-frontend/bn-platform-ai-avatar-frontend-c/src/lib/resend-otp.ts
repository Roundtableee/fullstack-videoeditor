import { createClient } from "./utils/supabase/client";

export async function resendSignupOTP(email: string) {
  const supabase = createClient();
  return await supabase.auth.resend({ type: "signup", email });
}
