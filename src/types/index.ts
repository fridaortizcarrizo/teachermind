export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type GrammarStatus = 'not_started' | 'introduced' | 'practicing' | 'consolidated' | 'needs_review';
export type VocabStatus = 'new' | 'practicing' | 'consolidated';
export type MaterialType = 'reading' | 'listening' | 'grammar_drill' | 'speaking_prompt' | 'vocabulary_task' | 'matching' | 'fill_blanks' | 'true_false' | 'multiple_choice';
export type BlockSize = 4 | 8 | 12 | 16;

export interface Student {
  id: string;
  name: string;
  level: CEFRLevel;
  age: number;
  profession: string;
  interests: string[];
  objectives: string[];
  difficulties: string[];
  strengths: string[];
  notes: string;
  avatar?: string;
  email?: string;
  createdAt: string;
}

export interface GrammarTopic {
  id: string;
  studentId: string;
  topic: string;
  status: GrammarStatus;
  timesWorked: number;
  lastWorked: string;
  errors: string[];
}

export interface VocabularyItem {
  id: string;
  studentId: string;
  word: string;
  translation?: string;
  category: string;
  status: VocabStatus;
  context?: string;
}

export interface Lesson {
  id: string;
  studentId: string;
  blockId?: string;
  title: string;
  date: string;
  objective: string;
  grammarFocus: string[];
  vocabularyFocus: string[];
  warmUp: string;
  homeworkCheck?: string;
  grammarExplanation: string;
  exercises: string[];
  speakingTask: string;
  homework: string;
  observations?: string;
  status: 'planned' | 'completed' | 'cancelled';
}

export interface LessonBlock {
  id: string;
  studentId: string;
  title: string;
  size: BlockSize;
  objectives: string[];
  startDate: string;
  endDate?: string;
  lessonsCompleted: number;
  status: 'active' | 'completed' | 'paused';
}

export interface Material {
  id: string;
  lessonId?: string;
  type: MaterialType;
  title: string;
  content: string;
  level: CEFRLevel;
  topic: string;
  grammarFocus?: string;
  createdAt: string;
}

export interface ProgressNote {
  id: string;
  studentId: string;
  date: string;
  type: 'observation' | 'evaluation' | 'milestone';
  content: string;
}

export interface ProfessionalModule {
  id: string;
  profession: string;
  categories: { name: string; words: string[] }[];
}

export interface SmartSuggestion {
  id: string;
  studentId?: string;
  type: 'grammar' | 'speaking' | 'review' | 'warning' | 'tip';
  message: string;
  priority: 'low' | 'medium' | 'high';
}
