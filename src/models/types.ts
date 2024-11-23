export interface HealthProfile {
  dietary: string[];
  health: string[];
  allergies: string[];
}

interface BlacklistItem {
  item: string;
  alias: string[] | null;
  cause: string;
}

export interface AnalysisResult {
  blacklist: BlacklistItem[];
}

export interface OcrAnalysisRequest {
  text: string;  // Raw text from OCR
}

export interface ImageRequest {
  data: string;
  type: string;  // Raw text from OCR
}

export interface OcrAnalysisResponse {
  status: 'good' | 'okay' | 'bad';
  matches: {
    ingredient: string;
    found: string;
    cause: string;
  }[];
  summary: string;
}

export interface ImageAnalysisResponse {
  status: 'okay' | 'skip';
  matches: {
    ingredient: string;
    found: string;
    cause: string;
  }[];
  summary: string;
}

