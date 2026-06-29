export interface User {
  uid: string;
  email: string;
  name?: string;
}

export interface Category {
  id: string;
  name: string;
  color?: string; // Tailwind color class, e.g., 'bg-blue-50 text-blue-700'
  description?: string;
  userId: string;
  createdAt: string;
}

export interface Vocabulary {
  id: string;
  userId: string;
  deutsch: string; // e.g. "Tisch" or "der Tisch"
  vietnamesisch: string; // e.g. "cái bàn"
  article: 'der' | 'die' | 'das' | 'none'; // Gender for nouns
  plural?: string; // Plural form e.g. "die Tische"
  exampleDe?: string; // Example sentence in German
  exampleVi?: string; // Example sentence in Vietnamese
  categoryId: string; // Links to Category
  status: 'learning' | 'mastered';
  createdAt: string;
  updatedAt?: string;
}

export interface AIAnalysisResult {
  deutsch: string;
  article: 'der' | 'die' | 'das' | 'none';
  plural: string;
  vietnamesisch: string;
  exampleDe: string;
  exampleVi: string;
  explanation?: string;
}
