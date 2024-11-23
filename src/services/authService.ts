import { supabaseClient } from '../config/supabase';

export class AuthService {
  async signInWithGoogle() {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: process.env.REDIRECT_URL
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('user_profiles')
        .select('*')
        .eq('userId', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }
}