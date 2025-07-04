import { createClient } from "./utils/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";

export async function signUp(userData: {
  name: string;
  email: string;
  password: string;
  role?: string;
}) {
  const supabase = createClient();

  const { email, password } = userData;

  const { data, error } = await supabase.functions.invoke('registerWithCheck', {
    body: {
      email: email,
      password: password,
    }
  });

  if (error && error instanceof FunctionsHttpError) {
    const errorMessage = await error.context.json();
    return { data, error: errorMessage.error || "Unknown error" };
  }

  return { data, error };
}

export async function signIn({
  email,
  password,
}: {
  email: string;
  password: string;
}) {
  const supabase = await createClient();

  const { error, data } = await supabase.auth.signInWithPassword({ 
    email, 
    password 
  });
  
  return { data, error };
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function verifyOTP({
  email,
  token,
}: {
  email: string;
  token: string;
}) {
  const supabase = await createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'signup'
  });

  return { data, error };
}