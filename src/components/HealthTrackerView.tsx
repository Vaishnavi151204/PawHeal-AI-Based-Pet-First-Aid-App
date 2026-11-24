import { useEffect, useState } from 'react';
import { Calendar, FileText, Pill, Plus, Scale, Syringe, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type {
  AppointmentRecord,
  HealthNote,
  InjuryAssessment,
  MedicationReminder,
  PetProfile,
  VaccinationRecord,
  WeightLog,
} from '../types/pawheal';

interface HealthTrackerViewProps {
  pets: PetProfile[];
  vaccinations: VaccinationRecord[];
  medications: MedicationReminder[];
  appointments: AppointmentRecord[];
  weightLogs: WeightLog[];
  healthNotes: HealthNote[];
  assessments: InjuryAssessment[];
  onTrackerChanged: () => Promise<void>;
}

type TrackerTab = 'vaccinations' | 'medications' | 'appointments' | 'weight' | 'notes' | 'history';

export function HealthTrackerView({
  pets,
  vaccinations,
  medications,
  appointments,
  weightLogs,
  healthNotes,
  assessments,
  onTrackerChanged,
}: HealthTrackerViewProps) {
  const [tab, setTab] = useState<TrackerTab>('vaccinations');
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id ?? '');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Vaccination inputs
  const [vaccineName, setVaccineName] = useState('');
  const [administeredDate, setAdministeredDate] = useState(new Date().toISOString().slice(0, 10));
  const [nextDueDate, setNextDueDate] = useState('');
  const [clinicName, setClinicName] = useState('');

  // Medication inputs
  const [medicationName, setMedicationName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('Once daily');
  const [reminderTime, setReminderTime] = useState('09:00');

  // Appointment inputs
  const [apptTitle, setApptTitle] = useState('');
  const [apptClinic, setApptClinic] = useState('');
  const [apptDateTime, setApptDateTime] = useState('');
  const [apptReason, setApptReason] = useState('');

  // Weight inputs
  const [weightKg, setWeightKg] = useState('');
  const [weightDate, setWeightDate] = useState(new Date().toISOString().slice(0, 10));
  const [weightNote, setWeightNote] = useState('');

  // Note inputs
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');

  useEffect(() => {
    if (!selectedPetId && pets[0]) {
      setSelectedPetId(pets[0].id);
    }
  }, [pets, selectedPetId]);

  const petWeights = weightLogs
    .filter((w) => !selectedPetId || w.petId === selectedPetId)
    .slice()
    .sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));

  async function handleAddVaccination(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/api/tracker/vaccinations', {
        method: 'POST',
        body: JSON.stringify({
          petId: selectedPetId,
          vaccineName,
          administeredDate,
          nextDueDate,
          clinicName,
        }),
      });
      setVaccineName('');
      setClinicName('');
      await onTrackerChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save vaccination.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddMedication(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/api/tracker/medications', {
        method: 'POST',
        body: JSON.stringify({
          petId: selectedPetId,
          medicationName,
          dosage,
          frequency,
          reminderTime,
        }),
      });
      setMedicationName('');
      setDosage('');
      await onTrackerChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save medication.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddAppointment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/api/tracker/appointments', {
        method: 'POST',
        body: JSON.stringify({
          petId: selectedPetId,
          title: apptTitle,
          clinicName: apptClinic,
          dateTime: apptDateTime,
          reason: apptReason,
        }),
      });
      setApptTitle('');
      setApptClinic('');
      setApptReason('');
      await onTrackerChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save appointment.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddWeight(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/api/tracker/weights', {
        method: 'POST',
        body: JSON.stringify({
          petId: selectedPetId,
          weightKg: Number(weightKg),
          recordedAt: weightDate,
          note: weightNote,
        }),
      });
      setWeightKg('');
      setWeightNote('');
      await onTrackerChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log weight.');
    } finally {
      setSaving(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await apiRequest('/api/tracker/notes', {
        method: 'POST',
        body: JSON.stringify({
          petId: selectedPetId,
          title: noteTitle,
          note: noteBody,
        }),
      });
      setNoteTitle('');
      setNoteBody('');
      await onTrackerChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save health note.');
    } finally {
      setSaving(false);
    }
  }

  function renderWeightChart() {
    if (petWeights.length < 2) return null;
    const min = Math.min(...petWeights.map((w) => w.weightKg)) * 0.9;
    const max = Math.max(...petWeights.map((w) => w.weightKg)) * 1.1;
    const span = Math.max(0.5, max - min);
    const width = 520;
    const height = 140;
    const points = petWeights
      .map((w, i) => {
        const x = (i / (petWeights.length - 1)) * (width - 40) + 20;
        const y = height - 20 - ((w.weightKg - min) / span) * (height - 40);
        return `${x},${y}`;
      })
      .join(' ');

    return (
      <div className="bg-[#F7F8F6] rounded-xl border border-[#E2E8E2] p-4">
        <p className="text-xs font-semibold text-[#4A5553] mb-2">Weight Trend (kg)</p>
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36">
          <polyline
            fill="none"
            stroke="#0F766E"
            strokeWidth="2.5"
            points={points}
          />
          {petWeights.map((w, i) => {
            const x = (i / (petWeights.length - 1)) * (width - 40) + 20;
            const y = height - 20 - ((w.weightKg - min) / span) * (height - 40);
            return <circle key={w.id} cx={x} cy={y} r="4" fill="#0F766E" />;
          })}
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8E2]">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111817]">Health Tracker</h1>
          <p className="text-sm text-[#4A5553] mt-1">
            Track vaccinations, medication schedules, appointments, weight logs, and clinical notes.
          </p>
        </div>
        <select
          aria-label="Filter by pet"
          value={selectedPetId}
          onChange={(e) => setSelectedPetId(e.target.value)}
          className="h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
        >
          {pets.length === 0 && <option value="">Add a pet profile first</option>}
          {pets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.species})
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-1 p-1 bg-[#EAEFEA] rounded-lg w-fit">
        {(
          [
            { id: 'vaccinations', label: 'Vaccinations', icon: Syringe },
            { id: 'medications', label: 'Medications', icon: Pill },
            { id: 'appointments', label: 'Appointments', icon: Calendar },
            { id: 'weight', label: 'Weight', icon: Scale },
            { id: 'notes', label: 'Notes', icon: FileText },
            { id: 'history', label: 'Scan History', icon: FileText },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              tab === item.id ? 'bg-white text-[#111817] shadow-xs' : 'text-[#4A5553]'
            }`}
          >
            <item.icon className="w-3.5 h-3.5" />
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {pets.length === 0 && tab !== 'history' ? (
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-8 text-center text-sm text-[#4A5553]">
          Add a pet profile in &ldquo;My Pets&rdquo; first to log vaccinations, medications, appointments, weight, and notes.
        </div>
      ) : (
        <>
          {tab === 'vaccinations' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddVaccination}
                className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-[#111817]">
                  Add Vaccination Record
                </h2>
                <input
                  type="text"
                  required
                  value={vaccineName}
                  onChange={(e) => setVaccineName(e.target.value)}
                  placeholder="Vaccine name (e.g., Rabies, DHPP)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-[#4A5553] mb-1">Administered</label>
                    <input
                      type="date"
                      required
                      value={administeredDate}
                      onChange={(e) => setAdministeredDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#4A5553] mb-1">Next Due</label>
                    <input
                      type="date"
                      value={nextDueDate}
                      onChange={(e) => setNextDueDate(e.target.value)}
                      className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                    />
                  </div>
                </div>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Veterinary clinic name"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 rounded-lg bg-[#0F766E] text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Vaccination</span>
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                {vaccinations.filter((v) => v.petId === selectedPetId).length === 0 ? (
                  <p className="p-6 text-sm text-[#4A5553]">No vaccination records for this pet.</p>
                ) : (
                  vaccinations
                    .filter((v) => v.petId === selectedPetId)
                    .map((v) => (
                      <div key={v.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111817]">{v.vaccineName}</p>
                          <p className="text-xs text-[#4A5553] mt-0.5">
                            Given <span className="font-mono-tabular">{v.administeredDate}</span>
                            {v.nextDueDate && (
                              <>
                                {' '}
                                · Next due <span className="font-mono-tabular">{v.nextDueDate}</span>
                              </>
                            )}
                            {v.clinicName ? ` · ${v.clinicName}` : ''}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiRequest(`/api/tracker/vaccinations/${v.id}`, {
                              method: 'DELETE',
                            });
                            await onTrackerChanged();
                          }}
                          className="p-2 text-[#4A5553] hover:text-red-700 cursor-pointer"
                          aria-label="Delete vaccination"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {tab === 'medications' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddMedication}
                className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-[#111817]">
                  Add Medication Reminder
                </h2>
                <input
                  type="text"
                  required
                  value={medicationName}
                  onChange={(e) => setMedicationName(e.target.value)}
                  placeholder="Medication name"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    placeholder="Dosage (e.g., 1 tablet)"
                    className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                  />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                  />
                </div>
                <input
                  type="text"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="Frequency (e.g., Twice daily)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 rounded-lg bg-[#0F766E] text-white text-sm font-semibold cursor-pointer"
                >
                  Save Reminder
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                {medications.filter((m) => m.petId === selectedPetId).length === 0 ? (
                  <p className="p-6 text-sm text-[#4A5553]">No medication reminders added.</p>
                ) : (
                  medications
                    .filter((m) => m.petId === selectedPetId)
                    .map((m) => (
                      <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111817]">
                            {m.medicationName} — {m.dosage}
                          </p>
                          <p className="text-xs text-[#4A5553] mt-0.5">
                            {m.frequency} · <span className="font-mono-tabular">{m.reminderTime}</span> ·{' '}
                            {m.active ? 'Active' : 'Paused'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/tracker/medications/${m.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ active: !m.active }),
                              });
                              await onTrackerChanged();
                            }}
                            className="px-2.5 py-1 rounded-md border border-[#D4DDD4] text-xs font-medium cursor-pointer"
                          >
                            {m.active ? 'Pause' : 'Resume'}
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/tracker/medications/${m.id}`, {
                                method: 'DELETE',
                              });
                              await onTrackerChanged();
                            }}
                            className="p-2 text-[#4A5553] hover:text-red-700 cursor-pointer"
                            aria-label="Delete medication"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {tab === 'appointments' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddAppointment}
                className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-[#111817]">
                  Schedule Appointment
                </h2>
                <input
                  type="text"
                  required
                  value={apptTitle}
                  onChange={(e) => setApptTitle(e.target.value)}
                  placeholder="Visit title (e.g., Annual Wellness Exam)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <input
                  type="text"
                  value={apptClinic}
                  onChange={(e) => setApptClinic(e.target.value)}
                  placeholder="Veterinary clinic name"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <input
                  type="datetime-local"
                  required
                  value={apptDateTime}
                  onChange={(e) => setApptDateTime(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                />
                <input
                  type="text"
                  value={apptReason}
                  onChange={(e) => setApptReason(e.target.value)}
                  placeholder="Reason or questions for the vet"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 rounded-lg bg-[#0F766E] text-white text-sm font-semibold cursor-pointer"
                >
                  Save Appointment
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                {appointments.filter((a) => a.petId === selectedPetId).length === 0 ? (
                  <p className="p-6 text-sm text-[#4A5553]">No appointments scheduled.</p>
                ) : (
                  appointments
                    .filter((a) => a.petId === selectedPetId)
                    .map((a) => (
                      <div key={a.id} className="p-4 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111817]">{a.title}</p>
                          <p className="text-xs text-[#4A5553] mt-0.5">
                            {a.clinicName || 'Clinic TBD'} ·{' '}
                            <span className="font-mono-tabular">
                              {new Date(a.dateTime).toLocaleString()}
                            </span>{' '}
                            · {a.status}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            aria-label="Appointment status"
                            value={a.status}
                            onChange={async (e) => {
                              await apiRequest(`/api/tracker/appointments/${a.id}`, {
                                method: 'PATCH',
                                body: JSON.stringify({ status: e.target.value }),
                              });
                              await onTrackerChanged();
                            }}
                            className="h-8 px-2 rounded-md border border-[#D4DDD4] bg-white text-xs"
                          >
                            <option value="scheduled">Scheduled</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <button
                            type="button"
                            onClick={async () => {
                              await apiRequest(`/api/tracker/appointments/${a.id}`, {
                                method: 'DELETE',
                              });
                              await onTrackerChanged();
                            }}
                            className="p-2 text-[#4A5553] hover:text-red-700 cursor-pointer"
                            aria-label="Delete appointment"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {tab === 'weight' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddWeight}
                className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-[#111817]">
                  Log Weight Measurement
                </h2>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Weight in kg (e.g., 14.2)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                />
                <input
                  type="date"
                  required
                  value={weightDate}
                  onChange={(e) => setWeightDate(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
                />
                <input
                  type="text"
                  value={weightNote}
                  onChange={(e) => setWeightNote(e.target.value)}
                  placeholder="Optional note (e.g., Post-diet check)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 rounded-lg bg-[#0F766E] text-white text-sm font-semibold cursor-pointer"
                >
                  Save Weight Entry
                </button>
              </form>

              <div className="lg:col-span-7 space-y-4">
                {renderWeightChart()}
                <div className="bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                  {petWeights.length === 0 ? (
                    <p className="p-6 text-sm text-[#4A5553]">No weight logs yet.</p>
                  ) : (
                    petWeights
                      .slice()
                      .reverse()
                      .map((w) => (
                        <div key={w.id} className="p-4 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold font-mono-tabular text-[#111817]">
                              {w.weightKg} kg
                            </p>
                            {w.note && <p className="text-xs text-[#4A5553]">{w.note}</p>}
                          </div>
                          <span className="text-xs font-mono-tabular text-[#64716E]">
                            {w.recordedAt}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleAddNote}
                className="lg:col-span-5 bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4"
              >
                <h2 className="font-display text-base font-semibold text-[#111817]">
                  Add Health Note
                </h2>
                <input
                  type="text"
                  required
                  value={noteTitle}
                  onChange={(e) => setNoteTitle(e.target.value)}
                  placeholder="Note title (e.g., Appetite & Energy)"
                  className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <textarea
                  rows={4}
                  required
                  value={noteBody}
                  onChange={(e) => setNoteBody(e.target.value)}
                  placeholder="Describe observations, diet changes, or behavior..."
                  className="w-full p-3 rounded-lg border border-[#D4DDD4] text-sm"
                />
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-10 rounded-lg bg-[#0F766E] text-white text-sm font-semibold cursor-pointer"
                >
                  Save Health Note
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                {healthNotes.filter((n) => n.petId === selectedPetId).length === 0 ? (
                  <p className="p-6 text-sm text-[#4A5553]">No health notes logged for this pet.</p>
                ) : (
                  healthNotes
                    .filter((n) => n.petId === selectedPetId)
                    .map((n) => (
                      <div key={n.id} className="p-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#111817]">{n.title}</p>
                          <p className="text-sm text-[#4A5553] mt-1 leading-relaxed">{n.note}</p>
                          <p className="text-xs font-mono-tabular text-[#64716E] mt-1.5">
                            {new Date(n.recordedAt).toLocaleString()}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={async () => {
                            await apiRequest(`/api/tracker/notes/${n.id}`, { method: 'DELETE' });
                            await onTrackerChanged();
                          }}
                          className="p-2 text-[#4A5553] hover:text-red-700 cursor-pointer"
                          aria-label="Delete note"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))
                )}
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className="bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
              {assessments.length === 0 ? (
                <p className="p-6 text-sm text-[#4A5553]">No injury scan assessments saved yet.</p>
              ) : (
                assessments.map((item) => (
                  <div key={item.id} className="p-5 space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-[#111817]">
                        {item.petName} — {item.possibleCategory}
                      </p>
                      <span className="text-xs font-semibold text-[#0F766E]">
                        {item.urgencyLevel.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[#4A5553]">
                      {item.bodyArea} ·{' '}
                      <span className="font-mono-tabular">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm text-[#4A5553]">{item.veterinaryRecommendation}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
