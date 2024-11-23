import { anthropic } from '../config/claude';
import { supabaseClient } from '../config/supabase';
import { HealthProfile, AnalysisResult } from '../models/types';

export class AnalysisService {
  async analyzeHealthProfile(profile: HealthProfile, userId: string): Promise<AnalysisResult> {
    try {
      const prompt = `Based on the following health profile:
Dietary Restrictions: ${profile.dietary.join(', ')}
Health Conditions: ${profile.health.join(', ')}
Allergies: ${profile.allergies.join(', ')}

Generate an EXTREMELY comprehensive analysis in JSON format that covers ALL possible ingredients and compounds that should be avoided. Structure the response as:
{
  "blacklist": [
    {
      "item": "main ingredient category",
      "alias": [
        // Include ALL possible variations:
        "scientific names",
        "common names",
        "E-numbers",
        "chemical compounds",
        "derivatives",
        "processed forms",
        "hidden sources",
        "international names",
        "industry terms",
        "ingredient label variations",
        "common misspellings",
        "related compounds",
        // Include specific products that typically contain this ingredient:
        "specific food products",
        "processed foods",
        "prepared meals",
        "sauces",
        "condiments",
        "seasonings",
        "additives",
        "preservatives",
        "flavorings",
        "colorings",
        "emulsifiers",
        "stabilizers",
        "thickeners"
      ],
      "cause": "specific condition/allergy/restriction requiring avoidance"
    }
  ]
}

Critical requirements:
1. Be EXTREMELY thorough - include EVERY possible ingredient variation
2. For each main ingredient, list ALL:
   - Scientific and chemical names
   - Common and commercial names
   - E-numbers and food additive codes
   - Derivative ingredients
   - Hidden sources in processed foods
   - Related compounds and substances
   - Industrial and manufacturing terms
   - International naming variations
   - Label declaration variations
   - Cross-contamination warnings
3. For medical conditions:
   - Include ALL ingredients that could affect the condition
   - List medication interactions
   - Include indirect sources (e.g., food additives)
   - List preservatives and processing aids
4. For allergies:
   - Include ALL possible cross-reactive substances
   - List potential cross-contamination sources
   - Include derivative ingredients
   - List hidden sources in processed foods
5. For dietary restrictions:
   - Include ALL prohibited ingredients
   - List hidden animal-derived ingredients
   - Include processing aids and additives
6. Special focus:
   - Comprehensive E-number listings
   - All possible chemical names
   - Industrial and commercial variants
   - Regional naming differences
   - Manufacturing byproducts
   - Cross-contamination risks

The goal is to create the most comprehensive possible list to protect users from ANY potentially harmful ingredients. Err on the side of including more items rather than fewer. Return only the JSON response, no additional text.`;

      const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      });

      const textContent = message.content.find(c => c.type === 'text');
      if (!textContent || typeof textContent.text !== 'string') {
        throw new Error('Unexpected response format from Claude');
      }

      const result = JSON.parse(textContent.text) as AnalysisResult;
      await this.saveAnalysis(profile, userId, result);
      return result;
    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  private async saveAnalysis(profile: HealthProfile, userId: String,  result: AnalysisResult) {
    try {
      await supabaseClient.from('analyses').insert({
        userId: userId,
        health_profile: profile,
        analysis_result: result,
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error('Database error:', error);
      throw error;
    }
  }
}