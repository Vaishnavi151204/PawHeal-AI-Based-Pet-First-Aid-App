import { useState } from 'react';
import { Bell, LogOut, ShieldCheck, Trash2 } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { UserProfile } from '../types/pawheal';

interface ProfileSettingsViewProps {
  user: UserProfile;
  onUserUpdated: (user: UserProfile) => void;
  onLoggedOut: () => void;
}

export function ProfileSettingsView({
  user,
  onUserUpdated,
  onLoggedOut,
}: ProfileSettingsViewProps) {
  const [fullName, setFullName] = useState(user.fullName);
  const [phone, setPhone] = useState(user.phone);
  const [emergencyVetContact, setEmergencyVetContact] = useState(user.emergencyVetContact);
  const [notificationsEnabled, setNotificationsEnabled] = useState(user.notificationsEnabled);
  const [medicationReminders, setMedicationReminders] = useState(user.medicationReminders);
  const [vaccinationReminders, setVaccinationReminders] = useState(user.vaccinationReminders);
  const [appointmentReminders, setAppointmentReminders] = useState(user.appointmentReminders);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await apiRequest<{ user: UserProfile }>('/api/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName,
          phone,
          emergencyVetContact,
          notificationsEnabled,
          medicationReminders,
          vaccinationReminders,
          appointmentReminders,
        }),
      });
      onUserUpdated(res.user);
      setMessage('Settings saved successfully.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save settings.');
    } finally {
      setSaving(false);
    }
  }

  async function requestBrowserNotifications() {
    if (!('Notification' in window)) {
      setError('Browser notifications are not supported on this device.');
      return;
    }
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      setMessage('Browser reminder notifications enabled.');
    } else {
      setError('Notification permission was declined by the browser.');
    }
  }

  async function handleDeleteAccount() {
    try {
      await apiRequest('/api/profile', { method: 'DELETE' });
      onLoggedOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete account.');
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="pb-5 border-b border-[#E2E8E2]">
        <h1 className="font-display text-2xl font-bold text-[#111817]">Profile & Settings</h1>
        <p className="text-sm text-[#4A5553] mt-1">
          Manage your contact details, care reminder preferences, privacy, and account access.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-3 text-sm text-teal-900">
          {message}
        </div>
      )}

      <form
        onSubmit={handleSave}
        className="bg-white rounded-xl border border-[#E2E8E2] p-6 space-y-5"
      >
        <h2 className="font-display text-base font-semibold text-[#111817]">Account Information</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">Email</label>
            <input
              type="email"
              disabled
              value={user.email}
              className="w-full h-10 px-3 rounded-lg border border-[#E2E8E2] bg-[#F7F8F6] text-sm text-[#4A5553]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">Phone Number</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 014-2900"
              className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#111817] mb-1">
              Primary Emergency Vet Phone
            </label>
            <input
              type="text"
              value={emergencyVetContact}
              onChange={(e) => setEmergencyVetContact(e.target.value)}
              placeholder="24h Animal ER phone or clinic"
              className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-[#E2E8E2] space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-base font-semibold text-[#111817] flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#0F766E]" />
              <span>Notification Preferences</span>
            </h2>
            <button
              type="button"
              onClick={requestBrowserNotifications}
              className="px-3 py-1.5 rounded-lg border border-[#D4DDD4] text-xs font-medium text-[#111817] hover:bg-[#F3F5F3] cursor-pointer"
            >
              Allow Browser Alerts
            </button>
          </div>

          {(
            [
              {
                label: 'Enable care notifications',
                checked: notificationsEnabled,
                onChange: setNotificationsEnabled,
              },
              {
                label: 'Medication dose reminders',
                checked: medicationReminders,
                onChange: setMedicationReminders,
              },
              {
                label: 'Vaccination booster reminders',
                checked: vaccinationReminders,
                onChange: setVaccinationReminders,
              },
              {
                label: 'Upcoming appointment alerts',
                checked: appointmentReminders,
                onChange: setAppointmentReminders,
              },
            ] as const
          ).map((item) => (
            <label key={item.label} className="flex items-center justify-between gap-4 py-1 text-sm">
              <span className="text-[#111817]">{item.label}</span>
              <input
                type="checkbox"
                checked={item.checked}
                onChange={(e) => item.onChange(e.target.checked)}
                className="w-4 h-4 accent-[#0F766E]"
              />
            </label>
          ))}
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </form>

      <section className="bg-white rounded-xl border border-[#E2E8E2] p-6 space-y-2">
        <h2 className="font-display text-base font-semibold text-[#111817] flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
          <span>Privacy & Veterinary Disclaimer</span>
        </h2>
        <p className="text-sm text-[#4A5553] leading-relaxed">
          Your pet profiles, health notes, and injury assessments are isolated to your authenticated account. AI injury analysis and chat guidance are informational first-aid tools only and do not constitute a veterinary diagnosis.
        </p>
      </section>

      <section className="bg-white rounded-xl border border-[#E2E8E2] p-6 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={async () => {
            await apiRequest('/api/auth/logout', { method: 'POST' });
            onLoggedOut();
          }}
          className="h-10 px-4 rounded-lg border border-[#D4DDD4] text-sm font-medium text-[#111817] hover:bg-[#F3F5F3] flex items-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>

        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="h-10 px-4 rounded-lg border border-red-200 text-sm font-medium text-red-700 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete Account</span>
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-800 font-medium">Permanently delete all data?</span>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="h-9 px-3 rounded-lg border border-[#D4DDD4] text-xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              className="h-9 px-3 rounded-lg bg-red-700 text-white text-xs font-semibold cursor-pointer"
            >
              Confirm Delete
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
