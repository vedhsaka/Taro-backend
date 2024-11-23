// src/routes/analysis.ts

import { Router, Request, Response, NextFunction } from 'express';
import { AnalysisService } from '../services/analysisService';
import { HealthProfile } from '../models/types';
import { ParamsDictionary } from 'express-serve-static-core';
import { AppError } from '../middleware/errorHandler';  // Changed from @/middleware/errorHandler

const router = Router();
const analysisService = new AnalysisService();

router.post('/analyze', async (
  req: Request<ParamsDictionary, any, HealthProfile>,
  res: Response,
  next: NextFunction
) => {
  try {
    const profile = req.body;
    const userId = req.header('X-User-Id');
    
    if (!userId) {
      throw new AppError(400, 'X-User-Id header is required');
    }

    const result = await analysisService.analyzeHealthProfile(profile, userId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;