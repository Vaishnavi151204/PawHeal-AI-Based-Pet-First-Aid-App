import {
  Activity,
  AlertTriangle,
  BookOpen,
  CalendarClock,
  Camera,
  ChevronRight,
  MapPin,
  MessageSquareHeart,
  PawPrint,
  Plus,
} from 'lucide-react';
import type {
  AppSection,
  AppointmentRecord,
  InjuryAssessment,
  MedicationReminder,
  PetProfile,
  UserProfile,
  VaccinationRecord,
} from '../types/pawheal';

interface DashboardViewProps {
  user: UserProfile;
  pets: PetProfile[];
  assessments: InjuryAssessment[];
  vaccinations: VaccinationRecord[];
  medications: MedicationReminder[];
  appointments: AppointmentRecord[];
  onNavigate: (section: AppSection) => void;
  onSelectPetForScan: (petId: string) => void;
}

export function DashboardView({
  user,
  pets,
  assessments,
  vaccinations,
  medications,
  appointments,
  onNavigate,
  onSelectPetForScan,
}: DashboardViewProps) {
  const firstName = user.fullName.split(' ')[0] || 'Pet Parent';
  const activeMeds = medications.filter((m) => m.active);
  const upcomingAppointments = appointments.filter((a) => a.status === 'scheduled');
  const dueVaccines = vaccinations.filter((v) => Boolean(v.nextDueDate));

  return (
    <div className="space-y-8">
      <section className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E2E8E2]">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111817] text-balance">
            Welcome back, {firstName}
          </h1>
          <p className="text-sm text-[#4A5553] mt-1">
            {pets.length === 0
              ? 'Add your first pet profile to unlock personalized AI triage, reminders, and health tracking.'
              : `Monitoring ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} · ${activeMeds.length} active medications · ${upcomingAppointments.length} scheduled visits`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('nearby')}
            className="h-10 px-4 rounded-lg border border-[#D4DDD4] bg-white hover:bg-[#F3F5F3] text-sm font-medium text-[#111817] flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-[#0F766E]" />
            <span>Nearby Vets</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Injury</span>
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('scanner')}
          className="text-left p-5 rounded-xl bg-white border border-[#E2E8E2] hover:border-[#0F766E] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mb-4">
            <Camera className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-semibold text-[#111817] group-hover:text-[#0F766E]">
            AI Injury Scanner
          </h2>
          <p className="text-xs text-[#4A5553] mt-1 leading-relaxed">
            Upload or capture a photo for structured triage observations and first-aid actions.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('chat')}
          className="text-left p-5 rounded-xl bg-white border border-[#E2E8E2] hover:border-[#0F766E] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#15803D]/10 text-[#15803D] flex items-center justify-center mb-4">
            <MessageSquareHeart className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-semibold text-[#111817] group-hover:text-[#0F766E]">
            AI Care Assistant
          </h2>
          <p className="text-xs text-[#4A5553] mt-1 leading-relaxed">
            Ask questions tailored to your pet&apos;s species, weight, allergies, and medical notes.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('nearby')}
          className="text-left p-5 rounded-xl bg-white border border-[#E2E8E2] hover:border-[#0F766E] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mb-4">
            <MapPin className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-semibold text-[#111817] group-hover:text-[#0F766E]">
            Veterinary Clinics
          </h2>
          <p className="text-xs text-[#4A5553] mt-1 leading-relaxed">
            Search nearby veterinary clinics, animal hospitals, and welfare shelters with distance.
          </p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('first_aid')}
          className="text-left p-5 rounded-xl bg-white border border-[#E2E8E2] hover:border-[#0F766E] transition-colors cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center mb-4">
            <BookOpen className="w-5 h-5" />
          </div>
          <h2 className="font-display text-base font-semibold text-[#111817] group-hover:text-[#0F766E]">
            First-Aid Library
          </h2>
          <p className="text-xs text-[#4A5553] mt-1 leading-relaxed">
            Offline-ready step-by-step protocols for bleeding, burns, choking, heatstroke, and toxins.
          </p>
        </button>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#111817]">Your Pets</h2>
            <button
              type="button"
              onClick={() => onNavigate('pets')}
              className="text-sm font-medium text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Manage Pets</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {pets.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-8 text-center">
              <div className="w-12 h-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mx-auto mb-3">
                <PawPrint className="w-6 h-6" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#111817]">
                No pets added yet
              </h3>
              <p className="text-sm text-[#4A5553] mt-1 max-w-md mx-auto">
                Create a profile with species, age, weight, and allergies so AI assessments and chat advice match your pet.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('pets')}
                className="mt-4 h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-medium inline-flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Pet Profile</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {pets.map((pet) => (
                <div
                  key={pet.id}
                  className="bg-white rounded-xl border border-[#E2E8E2] p-4 flex items-center gap-4"
                >
                  <img
                    src={pet.photoUrl}
                    alt={`${pet.name} profile`}
                    referrerPolicy="no-referrer"
                    className="w-16 h-16 rounded-xl object-cover bg-[#EEF1EE] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-display text-base font-semibold text-[#111817] truncate">
                      {pet.name}
                    </h3>
                    <p className="text-xs text-[#4A5553] mt-0.5 truncate">
                      {pet.species} · {pet.breed || 'Mixed'} ·{' '}
                      <span className="font-mono-tabular">{pet.ageYears}y</span> ·{' '}
                      <span className="font-mono-tabular">{pet.weightKg} kg</span>
                    </p>
                    <div className="mt-2.5 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPetForScan(pet.id);
                          onNavigate('scanner');
                        }}
                        className="text-xs font-medium text-[#0F766E] hover:underline cursor-pointer"
                      >
                        Scan injury
                      </button>
                      <button
                        type="button"
                        onClick={() => onNavigate('tracker')}
                        className="text-xs font-medium text-[#4A5553] hover:text-[#111817] hover:underline cursor-pointer"
                      >
                        Health records
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold text-[#111817]">
                Recent Injury Assessments
              </h2>
              <button
                type="button"
                onClick={() => onNavigate('scanner')}
                className="text-sm font-medium text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Scanner</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {assessments.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#E2E8E2] p-6 text-sm text-[#4A5553]">
                No injury assessments recorded yet. Use the AI Injury Scanner whenever you notice cuts, swelling, limping, or skin irritation.
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
                {assessments.slice(0, 3).map((item) => (
                  <div key={item.id} className="p-4 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111817] truncate">
                        {item.petName} — {item.possibleCategory}
                      </p>
                      <p className="text-xs text-[#4A5553] mt-0.5">
                        {item.bodyArea} ·{' '}
                        <span className="font-mono-tabular">
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold flex items-center gap-1 shrink-0 ${
                        item.urgencyLevel === 'emergency' || item.urgencyLevel === 'urgent'
                          ? 'text-red-700'
                          : item.urgencyLevel === 'moderate'
                            ? 'text-amber-700'
                            : 'text-[#15803D]'
                      }`}
                    >
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {item.urgencyLevel.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#111817]">
              Upcoming Care & Reminders
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('tracker')}
              className="text-sm font-medium text-[#0F766E] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Health Tracker</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] divide-y divide-[#E2E8E2]">
            {upcomingAppointments.length === 0 &&
            activeMeds.length === 0 &&
            dueVaccines.length === 0 ? (
              <div className="p-6 text-sm text-[#4A5553]">
                No upcoming reminders yet. Add vaccinations, daily medications, or vet appointments in Health Tracker.
              </div>
            ) : (
              <>
                {upcomingAppointments.slice(0, 3).map((appt) => {
                  const petName = pets.find((p) => p.id === appt.petId)?.name ?? 'Pet';
                  return (
                    <div key={appt.id} className="p-4 flex items-start gap-3">
                      <CalendarClock className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#111817] truncate">
                          {appt.title}
                        </p>
                        <p className="text-xs text-[#4A5553] mt-0.5">
                          {petName} · {appt.clinicName || 'Clinic TBD'} ·{' '}
                          <span className="font-mono-tabular">
                            {new Date(appt.dateTime).toLocaleString()}
                          </span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                {activeMeds.slice(0, 3).map((med) => {
                  const petName = pets.find((p) => p.id === med.petId)?.name ?? 'Pet';
                  return (
                    <div key={med.id} className="p-4 flex items-start gap-3">
                      <Activity className="w-4 h-4 text-[#15803D] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#111817] truncate">
                          {med.medicationName} ({med.dosage})
                        </p>
                        <p className="text-xs text-[#4A5553] mt-0.5">
                          {petName} · {med.frequency} ·{' '}
                          <span className="font-mono-tabular">{med.reminderTime}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
                {dueVaccines.slice(0, 2).map((vac) => {
                  const petName = pets.find((p) => p.id === vac.petId)?.name ?? 'Pet';
                  return (
                    <div key={vac.id} className="p-4 flex items-start gap-3">
                      <PawPrint className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[#111817] truncate">
                          {vac.vaccineName} booster due
                        </p>
                        <p className="text-xs text-[#4A5553] mt-0.5">
                          {petName} · Due{' '}
                          <span className="font-mono-tabular">{vac.nextDueDate}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          <div className="bg-white rounded-xl border border-[#E2E8E2] p-5">
            <h3 className="font-display text-sm font-semibold text-[#111817]">
              Emergency Escalation Reminder
            </h3>
            <p className="text-xs text-[#4A5553] mt-1.5 leading-relaxed">
              Seek immediate hands-on veterinary care for uncontrolled bleeding, difficulty breathing, pale gums, seizures, suspected poisoning, or collapse.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
