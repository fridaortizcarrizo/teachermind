import type { Student, GrammarTopic, VocabularyItem, Lesson, LessonBlock, Material, ProgressNote, SmartSuggestion, ProfessionalModule } from '@/types';

export const students: Student[] = [
  {
    id: '1',
    name: 'Valentina Ruiz',
    level: 'A2',
    age: 24,
    profession: 'Architecture Student',
    interests: ['design', 'travel', 'sustainability'],
    objectives: ['Pass B1 exam', 'Present projects in English', 'Read architecture articles'],
    difficulties: ['Prepositions of place', 'Present continuous vs simple', 'Speaking fluency'],
    strengths: ['Vocabulary retention', 'Reading comprehension', 'Motivation'],
    notes: 'Very motivated. Needs more speaking practice. Responds well to visual materials.',
    createdAt: '2024-09-01',
  },
  {
    id: '2',
    name: 'Camila Herrera',
    level: 'B1',
    age: 28,
    profession: 'Graphic Designer',
    interests: ['typography', 'illustration', 'music'],
    objectives: ['Improve speaking confidence', 'Learn design vocabulary', 'Write professional emails'],
    difficulties: ['Conditionals', 'Phrasal verbs', 'Pronunciation'],
    strengths: ['Grammar foundations', 'Creative writing', 'Listening comprehension'],
    notes: 'Great creative energy. Use design-related topics to keep engagement.',
    createdAt: '2024-10-15',
  },
  {
    id: '3',
    name: 'Lucía Méndez',
    level: 'A1',
    age: 22,
    profession: 'Psychology Student',
    interests: ['mindfulness', 'reading', 'cooking'],
    objectives: ['Basic conversation', 'Understand simple texts', 'Travel independently'],
    difficulties: ['Verb to be', 'Basic word order', 'Listening'],
    strengths: ['Enthusiasm', 'Note-taking', 'Pattern recognition'],
    notes: 'Complete beginner. Very shy at first but opens up with warm-up activities.',
    createdAt: '2025-01-10',
  },
  {
    id: '4',
    name: 'Martina López',
    level: 'A2',
    age: 30,
    profession: 'Software Developer',
    interests: ['technology', 'gaming', 'podcasts'],
    objectives: ['Technical documentation', 'Team meetings in English', 'Job interviews'],
    difficulties: ['Past tenses', 'Articles', 'Speaking in meetings'],
    strengths: ['Technical vocabulary', 'Self-study habits', 'Logical thinking'],
    notes: 'Learns fast with structured exercises. Prefers practical business scenarios.',
    createdAt: '2025-02-01',
  },
];

export const grammarTopics: GrammarTopic[] = [
  { id: 'g1', studentId: '1', topic: 'Present Simple', status: 'consolidated', timesWorked: 5, lastWorked: '2025-02-15', errors: [] },
  { id: 'g2', studentId: '1', topic: 'Present Continuous', status: 'practicing', timesWorked: 3, lastWorked: '2025-03-01', errors: ['Forgets -ing spelling rules'] },
  { id: 'g3', studentId: '1', topic: 'Prepositions of Place', status: 'needs_review', timesWorked: 4, lastWorked: '2025-02-20', errors: ['Confuses in/on/at', 'Uses "in" for surfaces'] },
  { id: 'g4', studentId: '1', topic: 'Past Simple (Regular)', status: 'introduced', timesWorked: 1, lastWorked: '2025-03-05', errors: ['Pronunciation of -ed'] },
  { id: 'g5', studentId: '2', topic: 'Present Perfect', status: 'practicing', timesWorked: 4, lastWorked: '2025-03-02', errors: ['Confuses with past simple'] },
  { id: 'g6', studentId: '2', topic: 'First Conditional', status: 'introduced', timesWorked: 2, lastWorked: '2025-03-06', errors: ['Uses will in if-clause'] },
  { id: 'g7', studentId: '3', topic: 'Verb To Be', status: 'practicing', timesWorked: 3, lastWorked: '2025-03-04', errors: ['Omits verb in questions'] },
  { id: 'g8', studentId: '4', topic: 'Past Simple', status: 'needs_review', timesWorked: 3, lastWorked: '2025-03-03', errors: ['Irregular verbs', 'Question formation'] },
];

export const vocabulary: VocabularyItem[] = [
  { id: 'v1', studentId: '1', word: 'blueprint', translation: 'plano', category: 'Architecture', status: 'consolidated', context: 'The architect reviewed the blueprint.' },
  { id: 'v2', studentId: '1', word: 'facade', translation: 'fachada', category: 'Architecture', status: 'practicing' },
  { id: 'v3', studentId: '1', word: 'sustainable', translation: 'sostenible', category: 'Architecture', status: 'new' },
  { id: 'v4', studentId: '2', word: 'layout', translation: 'diseño/maqueta', category: 'Design', status: 'consolidated' },
  { id: 'v5', studentId: '2', word: 'mockup', translation: 'maqueta', category: 'Design', status: 'practicing' },
  { id: 'v6', studentId: '4', word: 'deploy', translation: 'desplegar', category: 'Technology', status: 'consolidated' },
  { id: 'v7', studentId: '4', word: 'repository', translation: 'repositorio', category: 'Technology', status: 'practicing' },
];

export const lessons: Lesson[] = [
  {
    id: 'l1', studentId: '1', blockId: 'b1', title: 'Describing Spaces', date: '2025-03-05',
    objective: 'Use prepositions of place to describe architectural spaces',
    grammarFocus: ['Prepositions of Place', 'There is/are'],
    vocabularyFocus: ['blueprint', 'facade', 'layout'],
    warmUp: 'Describe your ideal room using 5 sentences',
    homeworkCheck: 'Reviewed fill-in-the-blank exercise on prepositions',
    grammarExplanation: 'Prepositions of place: in, on, at, between, next to, in front of, behind',
    exercises: ['Match prepositions to images', 'Complete sentences about a floor plan', 'Error correction exercise'],
    speakingTask: 'Describe the layout of your university building to your partner',
    homework: 'Write 10 sentences describing your neighborhood using prepositions of place',
    observations: 'Still confuses in/on for surfaces. Needs more visual practice.',
    status: 'completed',
  },
  {
    id: 'l2', studentId: '1', blockId: 'b1', title: 'Daily Routines in Architecture', date: '2025-03-08',
    objective: 'Practice Present Simple in professional context',
    grammarFocus: ['Present Simple', 'Adverbs of Frequency'],
    vocabularyFocus: ['sustainable', 'deadline', 'client meeting'],
    warmUp: 'What do you usually do on Monday mornings?',
    grammarExplanation: 'Present Simple for routines and habits, adverbs of frequency placement',
    exercises: ['Gap fill with adverbs of frequency', 'Reorder sentences', 'Create questions about routines'],
    speakingTask: 'Interview: describe a typical day at your architecture studio',
    homework: 'Write a paragraph about your weekly routine using at least 5 adverbs of frequency',
    status: 'completed',
  },
  {
    id: 'l3', studentId: '1', title: 'Current Projects', date: '2025-03-12',
    objective: 'Present Continuous for actions happening now and temporary situations',
    grammarFocus: ['Present Continuous'],
    vocabularyFocus: ['currently', 'at the moment', 'renovation'],
    warmUp: 'What are you working on this week?',
    grammarExplanation: 'Present Continuous: am/is/are + verb-ing. For now, temporary, and planned future.',
    exercises: ['Identify present simple vs continuous', 'Transform sentences', 'Picture description'],
    speakingTask: 'Describe what is happening in these architecture site photos',
    homework: 'Record a 1-minute voice note describing what projects you are currently working on',
    status: 'planned',
  },
  {
    id: 'l4', studentId: '2', title: 'Design Feedback', date: '2025-03-06',
    objective: 'Give and receive feedback using Present Perfect',
    grammarFocus: ['Present Perfect'],
    vocabularyFocus: ['mockup', 'iteration', 'feedback'],
    warmUp: 'Have you ever received difficult feedback on your work?',
    grammarExplanation: 'Present Perfect for experiences and recent actions',
    exercises: ['Ever/never survey', 'Just/already/yet exercises', 'Design critique role-play'],
    speakingTask: 'Role-play: give feedback on a design mockup using Present Perfect',
    homework: 'Write 5 things you have learned in your design career',
    status: 'completed',
  },
  {
    id: 'l5', studentId: '2', title: 'If I Were a Client...', date: '2025-03-09',
    objective: 'First Conditional for professional scenarios',
    grammarFocus: ['First Conditional'],
    vocabularyFocus: ['deadline', 'budget', 'proposal'],
    warmUp: 'What will you do if you get a new client this week?',
    grammarExplanation: 'If + present simple, will + infinitive for real/possible situations',
    exercises: ['Match halves', 'Complete conditional sentences', 'Create your own conditionals'],
    speakingTask: 'Negotiate a design project using conditionals',
    homework: 'Write 8 conditional sentences about your work life',
    status: 'planned',
  },
];

export const lessonBlocks: LessonBlock[] = [
  {
    id: 'b1', studentId: '1', title: 'Foundations: A2 Core Grammar',
    size: 8, objectives: ['Master prepositions', 'Present Simple & Continuous', 'Basic past tenses', 'Architecture vocabulary'],
    startDate: '2025-02-15', lessonsCompleted: 2, status: 'active',
  },
  {
    id: 'b2', studentId: '2', title: 'Professional Communication B1',
    size: 12, objectives: ['Present Perfect mastery', 'Conditionals', 'Email writing', 'Design vocabulary'],
    startDate: '2025-02-01', lessonsCompleted: 4, status: 'active',
  },
  {
    id: 'b3', studentId: '3', title: 'Starter Block: First Steps',
    size: 4, objectives: ['Verb to be', 'Basic introductions', 'Numbers and daily objects', 'Simple questions'],
    startDate: '2025-03-01', lessonsCompleted: 1, status: 'active',
  },
];

export const progressNotes: ProgressNote[] = [
  { id: 'p1', studentId: '1', date: '2025-03-05', type: 'observation', content: 'Valentina showed improvement in vocabulary retention but still struggles with prepositions on/in.' },
  { id: 'p2', studentId: '1', date: '2025-02-28', type: 'milestone', content: 'Successfully used Present Simple consistently in a 5-minute speaking task.' },
  { id: 'p3', studentId: '2', date: '2025-03-06', type: 'observation', content: 'Camila is gaining confidence with Present Perfect. Ready to introduce conditionals.' },
  { id: 'p4', studentId: '3', date: '2025-03-04', type: 'observation', content: 'Lucía completed verb to be exercises with minimal errors. Moving to simple present next.' },
];

export const smartSuggestions: SmartSuggestion[] = [
  { id: 's1', studentId: '1', type: 'grammar', message: 'Valentina is ready to practice Present Continuous in context. Consider a lesson comparing Simple vs Continuous.', priority: 'high' },
  { id: 's2', studentId: '1', type: 'review', message: 'Prepositions of place need reinforcement. Last 2 classes showed recurring errors with in/on.', priority: 'medium' },
  { id: 's3', studentId: '2', type: 'speaking', message: 'Camila could benefit from a speaking-focused class. She hasn\'t had a pure speaking session in 3 classes.', priority: 'medium' },
  { id: 's4', studentId: '3', type: 'tip', message: 'Lucía responds well to visual materials. Try using picture-based exercises for her next grammar topic.', priority: 'low' },
  { id: 's5', type: 'warning', message: 'Martina hasn\'t had a class in 2 weeks. Consider scheduling a review session.', priority: 'high' },
];

export const professionalModules: ProfessionalModule[] = [
  {
    id: 'pm1', profession: 'Architecture',
    categories: [
      { name: 'Spatial Language', words: ['adjacent', 'overlooking', 'surrounding', 'beneath', 'elevated'] },
      { name: 'Layout Vocabulary', words: ['blueprint', 'floor plan', 'cross-section', 'elevation', 'scale model'] },
      { name: 'Design Verbs', words: ['sketch', 'draft', 'renovate', 'demolish', 'construct', 'redesign'] },
      { name: 'Presentation Language', words: ['as you can see', 'the key feature is', 'this allows for', 'the concept behind'] },
    ],
  },
  {
    id: 'pm2', profession: 'Graphic Design',
    categories: [
      { name: 'Visual Elements', words: ['composition', 'contrast', 'hierarchy', 'whitespace', 'alignment'] },
      { name: 'Process Words', words: ['iterate', 'prototype', 'wireframe', 'mockup', 'deliverable'] },
      { name: 'Feedback Language', words: ['refine', 'adjust', 'tweak', 'overhaul', 'polish'] },
    ],
  },
  {
    id: 'pm3', profession: 'Software Development',
    categories: [
      { name: 'Dev Process', words: ['deploy', 'debug', 'refactor', 'commit', 'merge', 'review'] },
      { name: 'Meeting Language', words: ['standup', 'sprint', 'backlog', 'blocker', 'milestone'] },
      { name: 'Documentation', words: ['README', 'changelog', 'specification', 'endpoint', 'payload'] },
    ],
  },
];
