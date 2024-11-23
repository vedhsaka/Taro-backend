// src/routes/auth.ts
import { Router } from 'express';
import { supabaseClient } from '../config/supabase';


const router = Router();
// Google Sign In endpoint for iOS
router.post('/google-signin', async (req, res) => {
    try {
      const { data, error } = await supabaseClient.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://f2ef-50-175-245-62.ngrok-free.app/auth/callback',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'email profile openid'
        }
      });
      if (error) throw error;
      res.json({ url: data.url });
    } catch (error) {
      console.error('Auth error:', error);
      res.status(500).json({ error: 'Authentication failed' });
    }
  });


router.get('/auth/callback', async (req, res) => {
    res.send(`
      <html>
        <body>
          <script>
            // Extract tokens from URL hash
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            
            // Get the tokens
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
            
            // Redirect to your iOS app with the tokens
            window.location.href = 'website.usetaro.Taro-Health://auth-callback?' + hash;
          </script>
        </body>
      </html>
    `);
  });
  

export default router;
