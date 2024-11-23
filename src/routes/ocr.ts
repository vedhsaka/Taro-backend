// src/routes/ocr.ts

import { Router } from 'express';
import { OcrService } from '../services/ocrService';
import { AppError } from '../middleware/errorHandler';
import { ImageService } from '../services/imageService';

const router = Router();
const ocrService = new OcrService();
const imageService = new ImageService();

router.post('/analyze-text', async (req, res, next) => {
    try {
      const { text } = req.body;
      const { image } = req.body;
      const userId = req.header('X-User-Id');

      if (!userId) {
        throw new AppError(400, 'X-User-Id header is required');
      }

      if(image != null) {
        if(!image.type || !image.data) {
          throw new AppError(400, 'Image does not have type or data');
        }

        const result = await imageService.checkImage({ type: image.type, data: image.data }, userId);
        res.json(result);
      } else {
        
        if (!text || typeof text !== 'string') {
          throw new AppError(400, 'Text is required and must be a string');
        }

    
        const result = await ocrService.analyzeText({ text }, userId);
        res.json(result);
      }
    } catch (error) {
      next(error);
    }
  });
  

export default router;