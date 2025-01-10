export interface TransformRequest {
  text: string;
  format: string;
}

export type TransformFormat = 
  | 'bullet-points' 
  | 'summary' 
  | 'email' 
  | 'meeting-notes'
  | 'business-letter'
  | 'social-post'; 