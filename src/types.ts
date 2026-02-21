export type Audience = 'general' | 'kids' | 'adults' | 'family';

export interface ScavengerHuntItem {
  task: string;
  hint: string;
  isFound: boolean;
}

export interface ScavengerHuntData {
  title: string;
  items: ScavengerHuntItem[];
  isCompleted: boolean;
}

export interface MCQQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface MCQData {
  questions: MCQQuestion[];
  score?: number;
  isCompleted: boolean;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  imageUrl?: string;
  mcq?: MCQData;
  scavengerHunt?: ScavengerHuntData;
  isStory?: boolean;
  mapsLinks?: { uri: string; title: string }[];
}

export interface HeritageSite {
  id: string;
  name: string;
  location: string;
  description: string;
  imageUrl: string;
  period: string;
  rating?: number;
  userRating?: number;
}

export interface User {
  name: string;
  email: string;
  isAuthenticated: boolean;
  grade?: number;
}

export type AppView = 'welcome' | 'login' | 'main';
