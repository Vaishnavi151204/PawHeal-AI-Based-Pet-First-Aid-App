import { useState } from 'react';
import { Edit3, PawPrint, Plus, Trash2, Upload, X } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { PetProfile, VaccinationRecord } from '../types/pawheal';

interface PetsViewProps {
  pets: PetProfile[];
  vaccinations: VaccinationRecord[];
  onPetsChanged: () => Promise<void>;
}

const PRESET_AVATARS = [
  { label: 'Dog Portrait', url: '/src/assets/images/pet_avatar_dog_1795541849318.jpg' },
  { label: 'Cat Portrait', url: '/src/assets/images/pet_avatar_cat_1795541849377.jpg' },
];

export function PetsView({ pets, vaccinations, onPetsChanged }: PetsViewProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<PetProfile | null>(null);

  const [name, setName] = useState('');
  const [species, setSpecies] = useState<PetProfile['species']>('Dog');
  const [breed, setBreed] = useState('');
  const [ageYears, setAgeYears] = useState('2');
  const [gender, setGender] = useState<PetProfile['gender']>('Male');
  const [weightKg, setWeightKg] = useState('12');
  const [allergies, setAllergies] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [photoUrl, setPhotoUrl] = useState(PRESET_AVATARS[0].url);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openNewForm() {
    setEditingPet(null);
    setName('');
    setSpecies('Dog');
    setBreed('');
    setAgeYears('2');
    setGender('Male');
    setWeightKg('12');
    setAllergies('');
    setMedicalHistory('');
    setPhotoUrl(PRESET_AVATARS[0].url);
    setError(null);
    setFormOpen(true);
  }

  function openEditForm(pet: PetProfile) {
    setEditingPet(pet);
    setName(pet.name);
    setSpecies(pet.species);
    setBreed(pet.breed);
    setAgeYears(String(pet.ageYears));
    setGender(pet.gender);
    setWeightKg(String(pet.weightKg));
    setAllergies(pet.allergies);
    setMedicalHistory(pet.medicalHistory);
    setPhotoUrl(pet.photoUrl);
    setError(null);
    setFormOpen(true);
  }

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Please choose a profile image under 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        name,
        species,
        breed,
        ageYears: Number(ageYears),
        gender,
        weightKg: Number(weightKg),
        allergies,
        medicalHistory,
        photoUrl,
      };
      if (editingPet) {
        await apiRequest(`/api/pets/${editingPet.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiRequest('/api/pets', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      await onPetsChanged();
      setFormOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save pet profile.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(pet: PetProfile) {
    try {
      await apiRequest(`/api/pets/${pet.id}`, { method: 'DELETE' });
      await onPetsChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete pet profile.');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E2E8E2]">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#111817]">Pet Profiles</h1>
          <p className="text-sm text-[#4A5553] mt-1">
            Maintain species, weight, allergies, medical history, and vaccination context for each pet.
          </p>
        </div>
        <button
          type="button"
          onClick={openNewForm}
          className="h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Pet</span>
        </button>
      </div>

      {error && !formOpen && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {formOpen && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-xl border border-[#E2E8E2] p-6 space-y-5"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-[#111817]">
              {editingPet ? `Edit ${editingPet.name}` : 'New Pet Profile'}
            </h2>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="p-2 text-[#4A5553] hover:text-[#111817] cursor-pointer"
              aria-label="Close form"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-4">
            <img
              src={photoUrl}
              alt="Selected pet preview"
              referrerPolicy="no-referrer"
              className="w-20 h-20 rounded-xl object-cover border border-[#E2E8E2] bg-[#EEF1EE]"
            />
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_AVATARS.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setPhotoUrl(preset.url)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer ${
                      photoUrl === preset.url
                        ? 'border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E]'
                        : 'border-[#D4DDD4] text-[#4A5553]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
                <label className="px-3 py-1.5 rounded-lg text-xs font-medium border border-[#D4DDD4] text-[#111817] hover:bg-[#F3F5F3] inline-flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Photo</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-xs text-[#64716E]">JPEG, PNG, or WEBP up to 2 MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Pet Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Max"
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Species</label>
              <select
                value={species}
                onChange={(e) => {
                  const val = e.target.value as PetProfile['species'];
                  setSpecies(val);
                  if (!editingPet && photoUrl.startsWith('/src/assets/')) {
                    setPhotoUrl(val === 'Cat' ? PRESET_AVATARS[1].url : PRESET_AVATARS[0].url);
                  }
                }}
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
              >
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Breed</label>
              <input
                type="text"
                value={breed}
                onChange={(e) => setBreed(e.target.value)}
                placeholder="Golden Retriever"
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Age (Years)</label>
              <input
                type="number"
                step="0.5"
                min="0"
                max="40"
                required
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as PetProfile['gender'])}
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] bg-white text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="250"
                required
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-[#D4DDD4] text-sm font-mono-tabular"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">
                Known Allergies
              </label>
              <textarea
                rows={2}
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="e.g., Chicken protein, flea collar sensitivity"
                className="w-full p-3 rounded-lg border border-[#D4DDD4] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#111817] mb-1">
                Medical History
              </label>
              <textarea
                rows={2}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="e.g., Neutered 2023, mild seasonal ear infections"
                className="w-full p-3 rounded-lg border border-[#D4DDD4] text-sm"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="h-10 px-4 rounded-lg border border-[#D4DDD4] text-sm font-medium text-[#4A5553] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="h-10 px-5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
            >
              {saving ? 'Saving...' : editingPet ? 'Save Changes' : 'Create Pet Profile'}
            </button>
          </div>
        </form>
      )}

      {pets.length === 0 && !formOpen ? (
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-[#0F766E]/10 text-[#0F766E] flex items-center justify-center mx-auto mb-3">
            <PawPrint className="w-6 h-6" />
          </div>
          <h2 className="font-display text-lg font-semibold text-[#111817]">No pet profiles yet</h2>
          <p className="text-sm text-[#4A5553] mt-1 max-w-md mx-auto">
            Add your pet&apos;s age, weight, breed, allergies, and medical notes to personalize AI injury triage and care advice.
          </p>
          <button
            type="button"
            onClick={openNewForm}
            className="mt-5 h-10 px-4 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Your First Pet</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {pets.map((pet) => {
            const petVaccines = vaccinations.filter((v) => v.petId === pet.id);
            return (
              <div
                key={pet.id}
                className="bg-white rounded-xl border border-[#E2E8E2] p-5 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={pet.photoUrl}
                    alt={`${pet.name}`}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover bg-[#EEF1EE] shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h2 className="font-display text-lg font-bold text-[#111817]">
                          {pet.name}
                        </h2>
                        <p className="text-xs text-[#4A5553] mt-0.5">
                          {pet.species} · {pet.breed || 'Mixed breed'} · {pet.gender}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditForm(pet)}
                          className="p-2 rounded-lg text-[#4A5553] hover:text-[#111817] hover:bg-[#F3F5F3] cursor-pointer"
                          aria-label={`Edit ${pet.name}`}
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(pet)}
                          className="p-2 rounded-lg text-[#4A5553] hover:text-red-700 hover:bg-red-50 cursor-pointer"
                          aria-label={`Delete ${pet.name}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-[#4A5553]">
                      <span>
                        Age: <strong className="font-mono-tabular text-[#111817]">{pet.ageYears} yrs</strong>
                      </span>
                      <span>
                        Weight: <strong className="font-mono-tabular text-[#111817]">{pet.weightKg} kg</strong>
                      </span>
                      <span>
                        Vaccinations: <strong className="font-mono-tabular text-[#111817]">{petVaccines.length}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8E2] space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-[#111817]">Allergies: </span>
                    <span className="text-[#4A5553]">{pet.allergies || 'None reported'}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-[#111817]">Medical history: </span>
                    <span className="text-[#4A5553]">{pet.medicalHistory || 'No prior conditions logged'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
