export enum View {
  DASHBOARD = 'DASHBOARD',
  LIVE_CONSULT = 'LIVE_CONSULT',
  SYMPTOM_CHAT = 'SYMPTOM_CHAT',
  IMAGING = 'IMAGING',
  LOCATOR = 'LOCATOR',
  RESEARCH = 'RESEARCH',
  ANATOMY = 'ANATOMY',
  RECORDS = 'RECORDS',
  PROFILE = 'PROFILE'
}

export interface EmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface UserProfile {
  personalInfo: {
    fullName: string;
    dateOfBirth: string;
    gender: string;
    bloodType: string;
    height: string;
    weight: string;
  };
  medicalHistory: {
    allergies: string[];
    conditions: string[];
    medications: string[];
  };
  emergencyContacts: EmergencyContact[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  images?: string[];
  isError?: boolean;
  sentiment?: 'positive' | 'neutral' | 'negative';
}

export interface LocationData {
  latitude: number;
  longitude: number;
}

export interface ResearchResult {
  text: string;
  sources: Array<{ uri: string; title: string }>;
}

export interface VideoState {
  isRecording: boolean;
  videoUrl: string | null;
  analysis: string | null;
}

declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}