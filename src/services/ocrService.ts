// src/services/ocrService.ts

import { supabaseClient } from '../config/supabase';
import { OcrAnalysisRequest } from '../models/types';
import { logger } from '../utils/logger';

interface OcrAnalysisResponse {
  status: 'skip' | 'okay';
  summary: string;
}

export class OcrService {
  async analyzeText(data: OcrAnalysisRequest, userId: string): Promise<OcrAnalysisResponse> {
    try {
      const { data: analysisData, error } = await supabaseClient
        .from('analyses')
        .select('analysis_result')
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !analysisData || analysisData.length === 0) {
        logger.error('Database query error:', error);
        throw new Error('No analysis found for this user');
      }

      const latestAnalysis = analysisData[0];
      
      if (!latestAnalysis?.analysis_result?.blacklist) {
        logger.error('Invalid analysis result structure');
        throw new Error('Invalid analysis data');
      }

      const normalizedText = this.normalizeText(data.text);
      const matches = this.findMatches(normalizedText, latestAnalysis.analysis_result.blacklist);

      return {
        status: matches.length > 0 ? 'skip' : 'okay',
        summary: this.generateSummary(matches)
      };

    } catch (error) {
      logger.error('OCR analysis error:', error);
      throw error;
    }
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private findMatches(text: string, blacklist: any[]) {
    const matches: string[] = [];
    
    blacklist.forEach(entry => {
      const allTerms = [entry.item, ...(entry.alias || [])].filter(Boolean);
      
      for (const term of allTerms) {
        if (!term) continue;
        
        const normalizedTerm = this.normalizeText(term);
        if (normalizedTerm && text.includes(normalizedTerm)) {
          matches.push(entry.item);
          break;
        }
      }
    });

    return matches;
  }

  private generateSummary(matches: string[]): string {
    if (matches.length === 0) {
      return "Safe to consume.";
    }

    if (matches.length === 1) {
      return `Contains ${matches[0]}.`;
    }

    return `Contains ${matches[0]} and other harmful ingredients.`;
  }
}