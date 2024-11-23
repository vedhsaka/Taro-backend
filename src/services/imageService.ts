import { anthropic } from '../config/claude';
import { supabaseClient } from '../config/supabase';
import { ImageRequest, OcrAnalysisResponse, HealthProfile, ImageAnalysisResponse } from '../models/types';
import { logger } from '../utils/logger';

export class ImageService {
  async checkImage(image: ImageRequest, userId: string): Promise<ImageAnalysisResponse> {
    try {
      // Fetch user's health profile from the latest analysis
      const { data: analysisData, error } = await supabaseClient
        .from('analyses')
        .select('health_profile')
        .eq('userId', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error || !analysisData || analysisData.length === 0) {
        logger.error('Database query error:', error);
        throw new Error('No health profile found for this user');
      }

      const healthProfile = analysisData[0].health_profile as HealthProfile;
      const result = await this.analyzeImageWithClaude(image, healthProfile);
      return this.processAnalysisResult(result);
    } catch (error) {
      logger.error('Image analysis error:', error);
      throw error;
    }
  }

  private async analyzeImageWithClaude(
    image: ImageRequest, 
    conditions: HealthProfile
  ): Promise<string> {
    const prompt = `Analyze this image in the context of the user's health profile:

    User has the following conditions:
    - Dietary restrictions: ${conditions.dietary.join(', ')}
    - Health conditions: ${conditions.health.join(', ')}
    - Allergies: ${conditions.allergies.join(', ')}

    First, identify what this image shows (food item, ingredient list, menu, cosmetic product, etc.).
    Then analyze it for any potential health concerns based on the user's conditions.

    Consider:
    1. Visible ingredients or components
    2. Common hidden ingredients or preparation methods
    3. Cross-contamination risks
    4. Known allergens or irritants
    5. Interactions with health conditions
    6. If it's food/menu - consider preparation methods and hidden ingredients
    7. If it's a cosmetic - consider absorption risks and skin reactions
    8. If it's an ingredient list - check for alternative names and derivatives

    Return a JSON response in this exact format:
    {
      "status": "skip" | "okay",
      "matches": [
        {
          "ingredient": "name of concerning ingredient",
          "found": "where/how it was found",
          "cause": "why it's a concern"
        }
      ],
      "summary": "VERY brief explanation (max 15 words) stating what was detected and if it's safe"
    }

    Use "skip" status if ANY concerning ingredients are found or if there's uncertainty.
    Use "okay" status ONLY if you are confident the item is safe for the user.
    The matches array should be empty if status is "okay".
    Keep the summary EXTREMELY concise - no more than 15 words.
    Examples of good summaries:
    - "Contains peanuts in sauce. Not safe due to allergy."
    - "Vegan menu item without allergens. Safe to consume."
    - "Cosmetic contains fragrance. May irritate sensitive skin."`;
    
    try {
        const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                    type: 'base64',
                    media_type: "image/jpeg",
                    data: image.data
                }
              },
              {
                type: 'text',
                text: prompt
              }
            ]
          }
        ]
      });

      const textContent = message.content.find(c => c.type === 'text');
      if (!textContent || typeof textContent.text !== 'string') {
        throw new Error('Unexpected response format from Claude');
      }

      return textContent.text;
    } catch (error) {
      logger.error('Claude API error:', error);
      throw error;
    }
  }

  private processAnalysisResult(claudeResponse: string): ImageAnalysisResponse {
    try {
      const analysis = JSON.parse(claudeResponse);
      
      // Ensure status is either 'skip' or 'okay'
      const status = analysis.matches?.length > 0 ? 'skip' : 'okay';
      
      // If summary is too long, truncate it
      let summary = analysis.summary || "";
      const words = summary.split(' ');
      if (words.length > 15) {
        summary = words.slice(0, 15).join(' ') + '...';
      }
      
      return {
        status,
        matches: analysis.matches || [],
        summary
      };
    } catch (error) {
      logger.error('Error processing Claude response:', error);
      throw new Error('Failed to process analysis result');
    }
  }
}