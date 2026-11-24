import crypto from 'node:crypto';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response } from 'express';
import {
  hashPassword,
  requireAuth,
  sanitizeUser,
  signSessionToken,
  verifyPassword,
} from './server/auth.ts';
import type { AuthenticatedRequest } from './server/auth.ts';
import { analyzePetInjury, generatePetCareReply } from './server/gemini.ts';
import { geocodeLocation, searchNearbyVetFacilities } from './server/places.ts';
import { mutateStore, readStore } from './server/store.ts';
import type {
  AppointmentRecord,
  ChatMessage,
  ChatSession,
  HealthNote,
  InjuryAssessment,
  MedicationReminder,
  PetProfile,
  VaccinationRecord,
  WeightLog,
} from './server/types.ts';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

app.use(express.json({ limit: '10mb' }));

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'PawHeal API', timestamp: new Date().toISOString() });
});

// --- Authentication & Account ---

app.post('/api/auth/signup', (req: Request, res: Response) => {
  const { fullName, email, password } = req.body ?? {};
  if (typeof fullName !== 'string' || fullName.trim().length < 2) {
    res.status(400).json({ error: 'Please enter your full name (at least 2 characters).' });
    return;
  }
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  if (typeof password !== 'string' || password.length < 8) {
    res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = readStore().users.find((u) => u.email === normalizedEmail);
  if (existing) {
    res.status(409).json({ error: 'An account with this email already exists.' });
    return;
  }

  const { hash, salt } = hashPassword(password);
  const now = new Date().toISOString();
  const newUser = mutateStore((draft) => {
    const account = {
      id: crypto.randomUUID(),
      email: normalizedEmail,
      fullName: fullName.trim(),
      phone: '',
      emergencyVetContact: '',
      notificationsEnabled: true,
      medicationReminders: true,
      vaccinationReminders: true,
      appointmentReminders: true,
      passwordHash: hash,
      passwordSalt: salt,
      resetToken: null,
      resetTokenExpiresAt: null,
      createdAt: now,
      updatedAt: now,
    };
    draft.users.push(account);
    return account;
  });

  const token = signSessionToken(newUser.id);
  res.cookie('pawheal_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.status(201).json({ token, user: sanitizeUser(newUser) });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (typeof email !== 'string' || !isValidEmail(email) || typeof password !== 'string') {
    res.status(400).json({ error: 'Valid email and password are required.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = readStore().users.find((u) => u.email === normalizedEmail);
  if (!user || !verifyPassword(password, user)) {
    res.status(401).json({ error: 'Invalid email or password.' });
    return;
  }

  const token = signSessionToken(user.id);
  res.cookie('pawheal_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json({ token, user: sanitizeUser(user) });
});

app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Please enter a valid email address.' });
    return;
  }
  const normalizedEmail = email.trim().toLowerCase();
  const user = readStore().users.find((u) => u.email === normalizedEmail);

  let resetCode: string | null = null;
  if (user) {
    resetCode = crypto.randomInt(100000, 999999).toString();
    mutateStore((draft) => {
      const target = draft.users.find((u) => u.id === user.id);
      if (target) {
        target.resetToken = resetCode;
        target.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      }
    });
  }

  res.json({
    message:
      'If an account matches that email, a 6-digit password reset code has been issued (valid for 15 minutes).',
    demoResetCode: process.env.NODE_ENV !== 'production' ? resetCode : undefined,
  });
});

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  const { email, code, newPassword } = req.body ?? {};
  if (typeof email !== 'string' || !isValidEmail(email)) {
    res.status(400).json({ error: 'Valid email is required.' });
    return;
  }
  if (typeof code !== 'string' || code.trim().length !== 6) {
    res.status(400).json({ error: 'Enter the 6-digit reset code.' });
    return;
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const updated = mutateStore((draft) => {
    const target = draft.users.find((u) => u.email === normalizedEmail);
    if (
      !target ||
      !target.resetToken ||
      target.resetToken !== code.trim() ||
      !target.resetTokenExpiresAt ||
      new Date(target.resetTokenExpiresAt).getTime() < Date.now()
    ) {
      return false;
    }
    const { hash, salt } = hashPassword(newPassword);
    target.passwordHash = hash;
    target.passwordSalt = salt;
    target.resetToken = null;
    target.resetTokenExpiresAt = null;
    target.updatedAt = new Date().toISOString();
    return true;
  });

  if (!updated) {
    res.status(400).json({ error: 'Invalid or expired reset code.' });
    return;
  }

  res.json({ message: 'Password updated successfully. You can now sign in.' });
});

app.post('/api/auth/logout', (_req: Request, res: Response) => {
  res.clearCookie('pawheal_session');
  res.json({ ok: true });
});

app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: sanitizeUser(req.authUser!) });
});

app.patch('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const {
    fullName,
    phone,
    emergencyVetContact,
    notificationsEnabled,
    medicationReminders,
    vaccinationReminders,
    appointmentReminders,
  } = req.body ?? {};

  const updated = mutateStore((draft) => {
    const user = draft.users.find((u) => u.id === userId);
    if (!user) return null;
    if (typeof fullName === 'string' && fullName.trim().length >= 2) {
      user.fullName = fullName.trim();
    }
    if (typeof phone === 'string') user.phone = phone.trim();
    if (typeof emergencyVetContact === 'string') {
      user.emergencyVetContact = emergencyVetContact.trim();
    }
    if (typeof notificationsEnabled === 'boolean') {
      user.notificationsEnabled = notificationsEnabled;
    }
    if (typeof medicationReminders === 'boolean') {
      user.medicationReminders = medicationReminders;
    }
    if (typeof vaccinationReminders === 'boolean') {
      user.vaccinationReminders = vaccinationReminders;
    }
    if (typeof appointmentReminders === 'boolean') {
      user.appointmentReminders = appointmentReminders;
    }
    user.updatedAt = new Date().toISOString();
    return sanitizeUser(user);
  });

  res.json({ user: updated });
});

app.delete('/api/profile', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  mutateStore((draft) => {
    draft.users = draft.users.filter((u) => u.id !== userId);
    draft.pets = draft.pets.filter((p) => p.userId !== userId);
    draft.injuryAssessments = draft.injuryAssessments.filter((a) => a.userId !== userId);
    draft.chatSessions = draft.chatSessions.filter((s) => s.userId !== userId);
    draft.chatMessages = draft.chatMessages.filter((m) => m.userId !== userId);
    draft.vaccinations = draft.vaccinations.filter((v) => v.userId !== userId);
    draft.medications = draft.medications.filter((m) => m.userId !== userId);
    draft.appointments = draft.appointments.filter((a) => a.userId !== userId);
    draft.weightLogs = draft.weightLogs.filter((w) => w.userId !== userId);
    draft.healthNotes = draft.healthNotes.filter((n) => n.userId !== userId);
  });
  res.clearCookie('pawheal_session');
  res.json({ ok: true });
});

// --- Pets CRUD ---

app.get('/api/pets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const pets = readStore().pets.filter((p) => p.userId === userId);
  res.json({ pets });
});

app.post('/api/pets', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const body = req.body ?? {};
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const species = body.species;
  const ageYears = Number(body.ageYears);
  const weightKg = Number(body.weightKg);

  if (!name) {
    res.status(400).json({ error: 'Pet name is required.' });
    return;
  }
  if (!['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'].includes(species)) {
    res.status(400).json({ error: 'Please select a valid pet species.' });
    return;
  }
  if (!Number.isFinite(ageYears) || ageYears < 0 || ageYears > 40) {
    res.status(400).json({ error: 'Enter a valid age in years.' });
    return;
  }
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 250) {
    res.status(400).json({ error: 'Enter a valid positive weight in kg.' });
    return;
  }

  const now = new Date().toISOString();
  const pet: PetProfile = {
    id: crypto.randomUUID(),
    userId,
    name,
    species,
    breed: typeof body.breed === 'string' ? body.breed.trim() : '',
    ageYears,
    gender: ['Male', 'Female', 'Unknown'].includes(body.gender) ? body.gender : 'Unknown',
    weightKg,
    allergies: typeof body.allergies === 'string' ? body.allergies.trim() : '',
    medicalHistory: typeof body.medicalHistory === 'string' ? body.medicalHistory.trim() : '',
    photoUrl:
      typeof body.photoUrl === 'string' && body.photoUrl.trim()
        ? body.photoUrl.trim()
        : species === 'Cat'
          ? '/src/assets/images/pet_avatar_cat_1795541849377.jpg'
          : '/src/assets/images/pet_avatar_dog_1795541849318.jpg',
    createdAt: now,
    updatedAt: now,
  };

  mutateStore((draft) => {
    draft.pets.push(pet);
    draft.weightLogs.push({
      id: crypto.randomUUID(),
      userId,
      petId: pet.id,
      weightKg: pet.weightKg,
      recordedAt: now.slice(0, 10),
      note: 'Initial pet profile weight',
    });
  });

  res.status(201).json({ pet });
});

app.patch('/api/pets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const petId = req.params.id;
  const body = req.body ?? {};

  const updated = mutateStore((draft) => {
    const pet = draft.pets.find((p) => p.id === petId && p.userId === userId);
    if (!pet) return null;

    if (typeof body.name === 'string' && body.name.trim()) pet.name = body.name.trim();
    if (['Dog', 'Cat', 'Bird', 'Rabbit', 'Other'].includes(body.species)) {
      pet.species = body.species;
    }
    if (typeof body.breed === 'string') pet.breed = body.breed.trim();
    if (body.ageYears !== undefined && Number.isFinite(Number(body.ageYears))) {
      pet.ageYears = Number(body.ageYears);
    }
    if (['Male', 'Female', 'Unknown'].includes(body.gender)) pet.gender = body.gender;
    if (body.weightKg !== undefined && Number.isFinite(Number(body.weightKg)) && Number(body.weightKg) > 0) {
      pet.weightKg = Number(body.weightKg);
    }
    if (typeof body.allergies === 'string') pet.allergies = body.allergies.trim();
    if (typeof body.medicalHistory === 'string') pet.medicalHistory = body.medicalHistory.trim();
    if (typeof body.photoUrl === 'string' && body.photoUrl.trim()) {
      pet.photoUrl = body.photoUrl.trim();
    }
    pet.updatedAt = new Date().toISOString();
    return pet;
  });

  if (!updated) {
    res.status(404).json({ error: 'Pet profile not found.' });
    return;
  }

  res.json({ pet: updated });
});

app.delete('/api/pets/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const petId = req.params.id;

  const removed = mutateStore((draft) => {
    const before = draft.pets.length;
    draft.pets = draft.pets.filter((p) => !(p.id === petId && p.userId === userId));
    if (draft.pets.length === before) return false;
    draft.vaccinations = draft.vaccinations.filter((v) => !(v.petId === petId && v.userId === userId));
    draft.medications = draft.medications.filter((m) => !(m.petId === petId && m.userId === userId));
    draft.appointments = draft.appointments.filter((a) => !(a.petId === petId && a.userId === userId));
    draft.weightLogs = draft.weightLogs.filter((w) => !(w.petId === petId && w.userId === userId));
    draft.healthNotes = draft.healthNotes.filter((n) => !(n.petId === petId && n.userId === userId));
    return true;
  });

  if (!removed) {
    res.status(404).json({ error: 'Pet profile not found.' });
    return;
  }

  res.json({ ok: true });
});

// --- AI Injury Scanner ---

app.get('/api/injury/history', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const assessments = readStore()
    .injuryAssessments.filter((a) => a.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ assessments });
});

app.post('/api/injury/analyze', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, bodyArea, symptoms, imageBase64, mimeType, imagePreviewDataUrl } = req.body ?? {};

  if (typeof bodyArea !== 'string' || !bodyArea.trim()) {
    res.status(400).json({ error: 'Please select the affected body area.' });
    return;
  }
  if (typeof imageBase64 !== 'string' || !imageBase64.trim()) {
    res.status(400).json({ error: 'Please upload or capture an image of the affected area.' });
    return;
  }
  if (typeof mimeType !== 'string' || !ALLOWED_MIME_TYPES.has(mimeType)) {
    res.status(400).json({ error: 'Unsupported image format. Please use JPEG, PNG, or WEBP.' });
    return;
  }

  const estimatedBytes = Math.floor((imageBase64.length * 3) / 4);
  if (estimatedBytes > MAX_IMAGE_BYTES) {
    res.status(400).json({ error: 'Image size exceeds the 5 MB limit. Please upload a smaller photo.' });
    return;
  }

  const pet = petId
    ? readStore().pets.find((p) => p.id === petId && p.userId === userId) ?? null
    : null;

  try {
    const analysis = await analyzePetInjury({
      imageBase64: imageBase64.trim(),
      mimeType,
      bodyArea: bodyArea.trim(),
      symptoms: typeof symptoms === 'string' ? symptoms.trim() : '',
      pet,
    });

    const assessment: InjuryAssessment = {
      id: crypto.randomUUID(),
      userId,
      petId: pet?.id ?? '',
      petName: pet?.name ?? 'Unspecified pet',
      bodyArea: bodyArea.trim(),
      symptoms: typeof symptoms === 'string' ? symptoms.trim() : '',
      imagePreviewDataUrl:
        typeof imagePreviewDataUrl === 'string' && imagePreviewDataUrl.length < 250000
          ? imagePreviewDataUrl
          : null,
      ...analysis,
      createdAt: new Date().toISOString(),
    };

    mutateStore((draft) => {
      draft.injuryAssessments.unshift(assessment);
    });

    res.status(201).json({ assessment });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to analyze the image right now. Please try again.';
    res.status(502).json({ error: message });
  }
});

app.delete('/api/injury/history/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const id = req.params.id;
  mutateStore((draft) => {
    draft.injuryAssessments = draft.injuryAssessments.filter(
      (a) => !(a.id === id && a.userId === userId),
    );
  });
  res.json({ ok: true });
});

// --- AI Pet-Care Chatbot ---

app.get('/api/chat/sessions', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const sessions = readStore()
    .chatSessions.filter((s) => s.userId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  res.json({ sessions });
});

app.get('/api/chat/sessions/:id/messages', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const sessionId = req.params.id;
  const session = readStore().chatSessions.find((s) => s.id === sessionId && s.userId === userId);
  if (!session) {
    res.status(404).json({ error: 'Chat session not found.' });
    return;
  }
  const messages = readStore()
    .chatMessages.filter((m) => m.sessionId === sessionId && m.userId === userId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  res.json({ session, messages });
});

app.post('/api/chat/message', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { sessionId, petId, message } = req.body ?? {};

  if (typeof message !== 'string' || !message.trim()) {
    res.status(400).json({ error: 'Please enter a message for the assistant.' });
    return;
  }
  const cleanMessage = message.trim();

  const store = readStore();
  let activeSession: ChatSession | null = null;
  if (typeof sessionId === 'string' && sessionId) {
    activeSession =
      store.chatSessions.find((s) => s.id === sessionId && s.userId === userId) ?? null;
  }

  const targetPetId = typeof petId === 'string' && petId ? petId : activeSession?.petId ?? null;
  const pet = targetPetId
    ? store.pets.find((p) => p.id === targetPetId && p.userId === userId) ?? null
    : null;

  const history = activeSession
    ? store.chatMessages.filter((m) => m.sessionId === activeSession!.id && m.userId === userId)
    : [];

  try {
    const aiResult = await generatePetCareReply({
      pet,
      history,
      userMessage: cleanMessage,
    });

    const now = new Date().toISOString();
    const later = new Date(Date.now() + 1).toISOString();

    const payload = mutateStore((draft) => {
      let sessionRecord: ChatSession;
      if (activeSession) {
        const found = draft.chatSessions.find((s) => s.id === activeSession!.id && s.userId === userId);
        if (found) {
          found.updatedAt = later;
          sessionRecord = found;
        } else {
          sessionRecord = {
            id: crypto.randomUUID(),
            userId,
            petId: pet?.id ?? null,
            petName: pet?.name ?? null,
            title: cleanMessage.slice(0, 48),
            createdAt: now,
            updatedAt: later,
          };
          draft.chatSessions.unshift(sessionRecord);
        }
      } else {
        sessionRecord = {
          id: crypto.randomUUID(),
          userId,
          petId: pet?.id ?? null,
          petName: pet?.name ?? null,
          title: cleanMessage.slice(0, 48),
          createdAt: now,
          updatedAt: later,
        };
        draft.chatSessions.unshift(sessionRecord);
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: sessionRecord.id,
        userId,
        role: 'user',
        content: cleanMessage,
        urgencyFlag: 'routine',
        suggestedFollowUps: [],
        createdAt: now,
      };

      const assistantMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sessionId: sessionRecord.id,
        userId,
        role: 'assistant',
        content: aiResult.reply,
        urgencyFlag: aiResult.urgencyFlag,
        suggestedFollowUps: aiResult.suggestedFollowUps,
        createdAt: later,
      };

      draft.chatMessages.push(userMsg, assistantMsg);
      return { session: sessionRecord, userMessage: userMsg, assistantMessage: assistantMsg };
    });

    res.status(201).json(payload);
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : 'Unable to reach the AI assistant right now. Please try again.';
    res.status(502).json({ error: errMsg });
  }
});

app.delete('/api/chat/sessions/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const sessionId = req.params.id;
  mutateStore((draft) => {
    draft.chatSessions = draft.chatSessions.filter(
      (s) => !(s.id === sessionId && s.userId === userId),
    );
    draft.chatMessages = draft.chatMessages.filter(
      (m) => !(m.sessionId === sessionId && m.userId === userId),
    );
  });
  res.json({ ok: true });
});

// --- Nearby Veterinary Clinics & Animal Welfare NGOs ---

app.get('/api/nearby', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const queryText = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category.trim() : 'All';
  const radiusKm = Number(req.query.radiusKm) || 10;

  let lat = Number(req.query.lat);
  let lng = Number(req.query.lng);
  let resolvedLocationLabel = '';

  try {
    if (queryText) {
      const geo = await geocodeLocation(queryText);
      lat = geo.lat;
      lng = geo.lng;
      resolvedLocationLabel = geo.label;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      res.status(400).json({
        error: 'Share your device location or enter a city / postal code to find nearby clinics.',
      });
      return;
    }

    const facilities = await searchNearbyVetFacilities({
      lat,
      lng,
      radiusKm,
      categoryFilter: category,
    });

    res.json({
      center: { lat, lng, label: resolvedLocationLabel || `${lat.toFixed(4)}, ${lng.toFixed(4)}` },
      facilities,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unable to search nearby veterinary facilities.';
    res.status(502).json({ error: message });
  }
});

// --- Health Tracker (Vaccinations, Medications, Appointments, Weight, Notes) ---

app.get('/api/tracker', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const store = readStore();
  res.json({
    vaccinations: store.vaccinations.filter((v) => v.userId === userId),
    medications: store.medications.filter((m) => m.userId === userId),
    appointments: store.appointments.filter((a) => a.userId === userId),
    weightLogs: store.weightLogs.filter((w) => w.userId === userId),
    healthNotes: store.healthNotes.filter((n) => n.userId === userId),
  });
});

app.post('/api/tracker/vaccinations', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, vaccineName, administeredDate, nextDueDate, clinicName, notes } = req.body ?? {};
  const pet = readStore().pets.find((p) => p.id === petId && p.userId === userId);
  if (!pet) {
    res.status(404).json({ error: 'Select a valid pet profile.' });
    return;
  }
  if (typeof vaccineName !== 'string' || !vaccineName.trim() || !administeredDate) {
    res.status(400).json({ error: 'Vaccine name and administered date are required.' });
    return;
  }

  const record: VaccinationRecord = {
    id: crypto.randomUUID(),
    userId,
    petId: pet.id,
    vaccineName: vaccineName.trim(),
    administeredDate: String(administeredDate),
    nextDueDate: nextDueDate ? String(nextDueDate) : '',
    clinicName: typeof clinicName === 'string' ? clinicName.trim() : '',
    notes: typeof notes === 'string' ? notes.trim() : '',
    createdAt: new Date().toISOString(),
  };

  mutateStore((draft) => {
    draft.vaccinations.unshift(record);
  });
  res.status(201).json({ vaccination: record });
});

app.delete('/api/tracker/vaccinations/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  mutateStore((draft) => {
    draft.vaccinations = draft.vaccinations.filter(
      (v) => !(v.id === req.params.id && v.userId === userId),
    );
  });
  res.json({ ok: true });
});

app.post('/api/tracker/medications', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, medicationName, dosage, frequency, startDate, endDate, reminderTime } =
    req.body ?? {};
  const pet = readStore().pets.find((p) => p.id === petId && p.userId === userId);
  if (!pet) {
    res.status(404).json({ error: 'Select a valid pet profile.' });
    return;
  }
  if (typeof medicationName !== 'string' || !medicationName.trim() || typeof dosage !== 'string' || !dosage.trim()) {
    res.status(400).json({ error: 'Medication name and dosage are required.' });
    return;
  }

  const record: MedicationReminder = {
    id: crypto.randomUUID(),
    userId,
    petId: pet.id,
    medicationName: medicationName.trim(),
    dosage: dosage.trim(),
    frequency: typeof frequency === 'string' && frequency.trim() ? frequency.trim() : 'Once daily',
    startDate: startDate ? String(startDate) : new Date().toISOString().slice(0, 10),
    endDate: endDate ? String(endDate) : '',
    reminderTime: reminderTime ? String(reminderTime) : '09:00',
    active: true,
    createdAt: new Date().toISOString(),
  };

  mutateStore((draft) => {
    draft.medications.unshift(record);
  });
  res.status(201).json({ medication: record });
});

app.patch('/api/tracker/medications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const updated = mutateStore((draft) => {
    const med = draft.medications.find((m) => m.id === req.params.id && m.userId === userId);
    if (!med) return null;
    if (typeof req.body?.active === 'boolean') med.active = req.body.active;
    return med;
  });
  if (!updated) {
    res.status(404).json({ error: 'Medication reminder not found.' });
    return;
  }
  res.json({ medication: updated });
});

app.delete('/api/tracker/medications/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  mutateStore((draft) => {
    draft.medications = draft.medications.filter(
      (m) => !(m.id === req.params.id && m.userId === userId),
    );
  });
  res.json({ ok: true });
});

app.post('/api/tracker/appointments', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, title, clinicName, dateTime, reason } = req.body ?? {};
  const pet = readStore().pets.find((p) => p.id === petId && p.userId === userId);
  if (!pet) {
    res.status(404).json({ error: 'Select a valid pet profile.' });
    return;
  }
  if (typeof title !== 'string' || !title.trim() || !dateTime) {
    res.status(400).json({ error: 'Appointment title and date/time are required.' });
    return;
  }

  const record: AppointmentRecord = {
    id: crypto.randomUUID(),
    userId,
    petId: pet.id,
    title: title.trim(),
    clinicName: typeof clinicName === 'string' ? clinicName.trim() : '',
    dateTime: String(dateTime),
    reason: typeof reason === 'string' ? reason.trim() : '',
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };

  mutateStore((draft) => {
    draft.appointments.unshift(record);
  });
  res.status(201).json({ appointment: record });
});

app.patch('/api/tracker/appointments/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const status = req.body?.status;
  if (!['scheduled', 'completed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid appointment status.' });
    return;
  }
  const updated = mutateStore((draft) => {
    const appt = draft.appointments.find((a) => a.id === req.params.id && a.userId === userId);
    if (!appt) return null;
    appt.status = status;
    return appt;
  });
  if (!updated) {
    res.status(404).json({ error: 'Appointment not found.' });
    return;
  }
  res.json({ appointment: updated });
});

app.delete('/api/tracker/appointments/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  mutateStore((draft) => {
    draft.appointments = draft.appointments.filter(
      (a) => !(a.id === req.params.id && a.userId === userId),
    );
  });
  res.json({ ok: true });
});

app.post('/api/tracker/weights', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, weightKg, recordedAt, note } = req.body ?? {};
  const pet = readStore().pets.find((p) => p.id === petId && p.userId === userId);
  if (!pet) {
    res.status(404).json({ error: 'Select a valid pet profile.' });
    return;
  }
  const weight = Number(weightKg);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 250) {
    res.status(400).json({ error: 'Enter a valid positive weight in kg.' });
    return;
  }

  const entry: WeightLog = {
    id: crypto.randomUUID(),
    userId,
    petId: pet.id,
    weightKg: weight,
    recordedAt: recordedAt ? String(recordedAt) : new Date().toISOString().slice(0, 10),
    note: typeof note === 'string' ? note.trim() : '',
  };

  mutateStore((draft) => {
    draft.weightLogs.push(entry);
    const targetPet = draft.pets.find((p) => p.id === pet.id && p.userId === userId);
    if (targetPet) {
      targetPet.weightKg = weight;
      targetPet.updatedAt = new Date().toISOString();
    }
  });

  res.status(201).json({ weightLog: entry });
});

app.post('/api/tracker/notes', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  const { petId, title, note } = req.body ?? {};
  const pet = readStore().pets.find((p) => p.id === petId && p.userId === userId);
  if (!pet) {
    res.status(404).json({ error: 'Select a valid pet profile.' });
    return;
  }
  if (typeof title !== 'string' || !title.trim() || typeof note !== 'string' || !note.trim()) {
    res.status(400).json({ error: 'Note title and details are required.' });
    return;
  }

  const entry: HealthNote = {
    id: crypto.randomUUID(),
    userId,
    petId: pet.id,
    title: title.trim(),
    note: note.trim(),
    recordedAt: new Date().toISOString(),
  };

  mutateStore((draft) => {
    draft.healthNotes.unshift(entry);
  });
  res.status(201).json({ healthNote: entry });
});

app.delete('/api/tracker/notes/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser!.id;
  mutateStore((draft) => {
    draft.healthNotes = draft.healthNotes.filter(
      (n) => !(n.id === req.params.id && n.userId === userId),
    );
  });
  res.json({ ok: true });
});

// --- Server Startup (Vite Dev Middleware or Static Production Build) ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PawHeal server listening on http://localhost:${PORT}`);
  });
}

startServer();
