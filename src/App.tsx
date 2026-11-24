/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  BookOpen,
  Camera,
  LayoutDashboard,
  MapPin,
  MessageSquareHeart,
  PawPrint,
  UserCog,
} from 'lucide-react';
import { AuthScreen } from './components/AuthScreen';
import { ChatbotView } from './components/ChatbotView';
import { DashboardView } from './components/DashboardView';
import { FirstAidView } from './components/FirstAidView';
import { HealthTrackerView } from './components/HealthTrackerView';
import { InjuryScannerView } from './components/InjuryScannerView';
import { NearbyVetsView } from './components/NearbyVetsView';
import { PetsView } from './components/PetsView';
import { ProfileSettingsView } from './components/ProfileSettingsView';
import { apiRequest, setStoredToken } from './lib/api';
import type {
  AppointmentRecord,
  AppSection,
  HealthNote,
  InjuryAssessment,
  MedicationReminder,
  PetProfile,
  UserProfile,
  VaccinationRecord,
  WeightLog,
} from './types/pawheal';

const NAV_ITEMS: Array<{ id: AppSection; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pets', label: 'My Pets', icon: PawPrint },
  { id: 'scanner', label: 'Injury Scanner', icon: Camera },
  { id: 'chat', label: 'AI Care Chat', icon: MessageSquareHeart },
  { id: 'nearby', label: 'Nearby Vets', icon: MapPin },
  { id: 'first_aid', label: 'First-Aid Guide', icon: BookOpen },
  { id: 'tracker', label: 'Health Tracker', icon: Activity },
  { id: 'profile', label: 'Profile & Settings', icon: UserCog },
];

export default function App() {
  const [booting, setBooting] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [section, setSection] = useState<AppSection>('dashboard');
  const [scanPetId, setScanPetId] = useState('');

  const [pets, setPets] = useState<PetProfile[]>([]);
  const [assessments, setAssessments] = useState<InjuryAssessment[]>([]);
  const [vaccinations, setVaccinations] = useState<VaccinationRecord[]>([]);
  const [medications, setMedications] = useState<MedicationReminder[]>([]);
  const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
  const [weightLogs, setWeightLogs] = useState<WeightLog[]>([]);
  const [healthNotes, setHealthNotes] = useState<HealthNote[]>([]);

  const loadWorkspaceData = useCallback(async () => {
    const [petsRes, injuryRes, trackerRes] = await Promise.all([
      apiRequest<{ pets: PetProfile[] }>('/api/pets'),
      apiRequest<{ assessments: InjuryAssessment[] }>('/api/injury/history'),
      apiRequest<{
        vaccinations: VaccinationRecord[];
        medications: MedicationReminder[];
        appointments: AppointmentRecord[];
        weightLogs: WeightLog[];
        healthNotes: HealthNote[];
      }>('/api/tracker'),
    ]);
    setPets(petsRes.pets);
    setAssessments(injuryRes.assessments);
    setVaccinations(trackerRes.vaccinations);
    setMedications(trackerRes.medications);
    setAppointments(trackerRes.appointments);
    setWeightLogs(trackerRes.weightLogs);
    setHealthNotes(trackerRes.healthNotes);
  }, []);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const res = await apiRequest<{ user: UserProfile }>('/api/auth/me');
        if (active) {
          setUser(res.user);
          await loadWorkspaceData();
        }
      } catch {
        if (active) setUser(null);
      } finally {
        if (active) setBooting(false);
      }
    }
    void bootstrap();
    return () => {
      active = false;
    };
  }, [loadWorkspaceData]);

  async function handleAuthenticated(loggedInUser: UserProfile) {
    setUser(loggedInUser);
    await loadWorkspaceData();
  }

  function handleLoggedOut() {
    setStoredToken(null);
    setUser(null);
    setPets([]);
    setAssessments([]);
    setVaccinations([]);
    setMedications([]);
    setAppointments([]);
    setWeightLogs([]);
    setHealthNotes([]);
    setSection('dashboard');
  }

  if (booting) {
    return (
      <div className="min-h-screen bg-[#F7F8F6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <p className="font-display text-xl font-bold text-[#0F766E]">PawHeal</p>
          <p className="text-xs text-[#4A5553]">Loading your pet care workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuthenticated={handleAuthenticated} />;
  }

  const activeNav = NAV_ITEMS.find((n) => n.id === section) ?? NAV_ITEMS[0];

  return (
    <div className="min-h-screen bg-[#F7F8F6] text-[#111817] flex">
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 bg-white border-r border-[#E2E8E2]">
        <div className="h-16 px-6 flex items-center border-b border-[#E2E8E2]">
          <span className="font-display text-lg font-bold tracking-tight text-[#0F766E]">
            PawHeal
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSection(item.id)}
                className={`w-full h-10 px-3.5 rounded-lg text-sm font-medium flex items-center gap-3 transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                    : 'text-[#4A5553] hover:bg-[#F3F5F3] hover:text-[#111817]'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E2E8E2]">
          <button
            type="button"
            onClick={() => setSection('profile')}
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#F3F5F3] transition-colors cursor-pointer"
          >
            <p className="text-sm font-semibold text-[#111817] truncate">{user.fullName}</p>
            <p className="text-xs text-[#64716E] truncate">{user.email}</p>
          </button>
        </div>
      </aside>

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-sm border-b border-[#E2E8E2] px-4 sm:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="lg:hidden font-display text-base font-bold text-[#0F766E] shrink-0">
              PawHeal
            </span>
            <span className="text-sm font-medium text-[#4A5553] truncate">
              {activeNav.label}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setSection('first_aid')}
              className="hidden sm:inline-flex text-xs font-medium text-[#4A5553] hover:text-[#111817] whitespace-nowrap cursor-pointer"
            >
              First-Aid Guide
            </button>
            <button
              type="button"
              onClick={() => setSection('pets')}
              className="lg:hidden text-xs font-medium text-[#4A5553] hover:text-[#111817] whitespace-nowrap cursor-pointer"
            >
              Pets
            </button>
            <button
              type="button"
              onClick={() => setSection('profile')}
              className="lg:hidden text-xs font-medium text-[#4A5553] hover:text-[#111817] whitespace-nowrap cursor-pointer"
            >
              Settings
            </button>
            <button
              type="button"
              onClick={() => setSection('scanner')}
              className="h-9 px-3.5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Quick Scan
            </button>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-8 py-6 pb-24 lg:pb-10">
          {section === 'dashboard' && (
            <DashboardView
              user={user}
              pets={pets}
              assessments={assessments}
              vaccinations={vaccinations}
              medications={medications}
              appointments={appointments}
              onNavigate={setSection}
              onSelectPetForScan={(petId) => setScanPetId(petId)}
            />
          )}

          {section === 'pets' && (
            <PetsView
              pets={pets}
              vaccinations={vaccinations}
              onPetsChanged={loadWorkspaceData}
            />
          )}

          {section === 'scanner' && (
            <InjuryScannerView
              pets={pets}
              initialPetId={scanPetId}
              assessments={assessments}
              onAssessmentsChanged={loadWorkspaceData}
              onOpenNearbyVets={() => setSection('nearby')}
            />
          )}

          {section === 'chat' && (
            <ChatbotView
              pets={pets}
              onOpenNearbyVets={() => setSection('nearby')}
            />
          )}

          {section === 'nearby' && <NearbyVetsView />}

          {section === 'first_aid' && <FirstAidView />}

          {section === 'tracker' && (
            <HealthTrackerView
              pets={pets}
              vaccinations={vaccinations}
              medications={medications}
              appointments={appointments}
              weightLogs={weightLogs}
              healthNotes={healthNotes}
              assessments={assessments}
              onTrackerChanged={loadWorkspaceData}
            />
          )}

          {section === 'profile' && (
            <ProfileSettingsView
              user={user}
              onUserUpdated={setUser}
              onLoggedOut={handleLoggedOut}
            />
          )}
        </main>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-sm border-t border-[#E2E8E2] grid grid-cols-5 items-center"
      >
        {(
          [
            { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
            { id: 'scanner', label: 'Scan', icon: Camera },
            { id: 'chat', label: 'Chat', icon: MessageSquareHeart },
            { id: 'nearby', label: 'Vets', icon: MapPin },
            { id: 'tracker', label: 'Tracker', icon: Activity },
          ] as const
        ).map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setSection(item.id)}
              className={`h-full flex flex-col items-center justify-center gap-1 cursor-pointer ${
                active ? 'text-[#0F766E] font-semibold' : 'text-[#4A5553]'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[11px] whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
