export interface UserAccount {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  emergencyVetContact: string;
  notificationsEnabled: boolean;
  medicationReminders: boolean;
  vaccinationReminders: boolean;
  appointmentReminders: boolean;
  passwordHash: string;
  passwordSalt: string;
  resetToken: string | null;
  resetTokenExpiresAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PetProfile {
  id: string;
  userId: string;
  name: string;
  species: 'Dog' | 'Cat' | 'Bird' | 'Rabbit' | 'Other';
  breed: string;
  ageYears: number;
  gender: 'Male' | 'Female' | 'Unknown';
  weightKg: number;
  allergies: string;
  medicalHistory: string;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
}

export type UrgencyLevel = 'low' | 'moderate' | 'urgent' | 'emergency';

export interface InjuryAssessment {
  id: string;
  userId: string;
  petId: string;
  petName: string;
  bodyArea: string;
  symptoms: string;
  imagePreviewDataUrl: string | null;
  visibleObservations: string[];
  possibleCategory: string;
  urgencyLevel: UrgencyLevel;
  safeImmediateActions: string[];
  actionsToAvoid: string[];
  veterinaryRecommendation: string;
  emergencyWarningSigns: string[];
  disclaimer: string;
  createdAt: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  petId: string | null;
  petName: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  urgencyFlag: 'routine' | 'monitor' | 'urgent_vet';
  suggestedFollowUps: string[];
  createdAt: string;
}

export interface VaccinationRecord {
  id: string;
  userId: string;
  petId: string;
  vaccineName: string;
  administeredDate: string;
  nextDueDate: string;
  clinicName: string;
  notes: string;
  createdAt: string;
}

export interface MedicationReminder {
  id: string;
  userId: string;
  petId: string;
  medicationName: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate: string;
  reminderTime: string;
  active: boolean;
  createdAt: string;
}

export interface AppointmentRecord {
  id: string;
  userId: string;
  petId: string;
  title: string;
  clinicName: string;
  dateTime: string;
  reason: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  petId: string;
  weightKg: number;
  recordedAt: string;
  note: string;
}

export interface HealthNote {
  id: string;
  userId: string;
  petId: string;
  title: string;
  note: string;
  recordedAt: string;
}

export interface StoreData {
  sessionSecret: string;
  users: UserAccount[];
  pets: PetProfile[];
  injuryAssessments: InjuryAssessment[];
  chatSessions: ChatSession[];
  chatMessages: ChatMessage[];
  vaccinations: VaccinationRecord[];
  medications: MedicationReminder[];
  appointments: AppointmentRecord[];
  weightLogs: WeightLog[];
  healthNotes: HealthNote[];
}
