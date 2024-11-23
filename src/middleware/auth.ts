// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { supabaseClient } from '../config/supabase';

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // Temporary bypass for development
  if (process.env.NODE_ENV === 'development') {
    req.user = { id: 'test-user' } as any; // Add basic user info
    return next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const { data: { user }, error } = await supabaseClient.auth.getUser(token);
    
    if (error || !user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Authentication failed' });
    return;
  }
};