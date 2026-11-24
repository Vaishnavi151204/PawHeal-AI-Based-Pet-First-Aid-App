export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  emergencyVetContact: string;
  notificationsEnabled: boolean;
  medicationReminders: boolean;
  vaccinationReminders: boolean;
  appointmentReminders: boolean;
  createdAt: string;
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
  petId: string | null;
  petName: string | null;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  urgencyFlag: 'routine' | 'monitor' | 'urgent_vet';
  suggestedFollowUps: string[];
  createdAt: string;
}

export interface NearbyVetFacility {
  id: string;
  name: string;
  category: 'Veterinary Clinic' | 'Animal Hospital' | 'Animal Welfare NGO';
  address: string;
  phone: string | null;
  website: string | null;
  openingHours: string | null;
  lat: number;
  lng: number;
  distanceKm: number;
  directionsUrl: string;
}

export interface VaccinationRecord {
  id: string;
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
  petId: string;
  weightKg: number;
  recordedAt: string;
  note: string;
}

export interface HealthNote {
  id: string;
  petId: string;
  title: string;
  note: string;
  recordedAt: string;
}

export type AppSection =
  | 'dashboard'
  | 'pets'
  | 'scanner'
  | 'chat'
  | 'nearby'
  | 'first_aid'
  | 'tracker'
  | 'profile';
