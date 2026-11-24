import { useState } from 'react';
import { Clock, ExternalLink, Globe, LocateFixed, MapPin, Phone, Search } from 'lucide-react';
import { apiRequest } from '../lib/api';
import type { NearbyVetFacility } from '../types/pawheal';

export function NearbyVetsView() {
  const [cityQuery, setCityQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [radiusKm, setRadiusKm] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [centerLabel, setCenterLabel] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<NearbyVetFacility[]>([]);
  const [searched, setSearched] = useState(false);

  async function runSearch(params: { lat?: number; lng?: number; q?: string }) {
    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      const qs = new URLSearchParams();
      if (params.q) qs.set('q', params.q);
      if (params.lat !== undefined && params.lng !== undefined) {
        qs.set('lat', String(params.lat));
        qs.set('lng', String(params.lng));
      }
      qs.set('radiusKm', String(radiusKm));
      qs.set('category', category);

      const res = await apiRequest<{
        center: { lat: number; lng: number; label: string };
        facilities: NearbyVetFacility[];
      }>(`/api/nearby?${qs.toString()}`);

      setCenterLabel(res.center.label);
      setFacilities(res.facilities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to search nearby veterinary clinics.');
      setFacilities([]);
    } finally {
      setLoading(false);
    }
  }

  function handleUseCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser. Enter your city or postal code instead.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void runSearch({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setLoading(false);
        setError('Location permission denied. Enter your city or postal code to search manually.');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }

  return (
    <div className="space-y-6">
      <div className="pb-5 border-b border-[#E2E8E2]">
        <h1 className="font-display text-2xl font-bold text-[#111817]">
          Nearby Veterinary Assistance
        </h1>
        <p className="text-sm text-[#4A5553] mt-1">
          Find real veterinary clinics, animal hospitals, and animal welfare organizations near you via OpenStreetMap directory data.
        </p>
      </div>

      <section className="bg-white rounded-xl border border-[#E2E8E2] p-5 space-y-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (cityQuery.trim()) {
              void runSearch({ q: cityQuery.trim() });
            }
          }}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#64716E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={cityQuery}
              onChange={(e) => setCityQuery(e.target.value)}
              placeholder="Enter city, neighborhood, or postal code (e.g., Seattle, WA)"
              className="w-full h-11 pl-10 pr-4 rounded-lg border border-[#D4DDD4] text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !cityQuery.trim()}
            className="h-11 px-5 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] disabled:opacity-50 text-white text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            Search Area
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleUseCurrentLocation}
            className="h-11 px-4 rounded-lg border border-[#D4DDD4] bg-white hover:bg-[#F3F5F3] text-sm font-medium text-[#111817] flex items-center justify-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LocateFixed className="w-4 h-4 text-[#0F766E]" />
            <span>Use My Location</span>
          </button>
        </form>

        <div className="flex flex-wrap items-center justify-between gap-4 pt-1">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#F3F5F3] rounded-lg">
            {['All', 'Veterinary Clinic', 'Animal Hospital', 'Animal Welfare NGO'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setCategory(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  category === tab
                    ? 'bg-white text-[#111817] shadow-xs'
                    : 'text-[#4A5553] hover:text-[#111817]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs text-[#4A5553]">
            <span>Radius:</span>
            {[5, 10, 25].map((km) => (
              <button
                key={km}
                type="button"
                onClick={() => setRadiusKm(km)}
                className={`px-2.5 py-1 rounded-md font-mono-tabular border cursor-pointer ${
                  radiusKm === km
                    ? 'border-[#0F766E] bg-[#0F766E]/10 text-[#0F766E] font-semibold'
                    : 'border-[#D4DDD4] text-[#4A5553]'
                }`}
              >
                {km} km
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-8 text-center text-sm text-[#4A5553]">
          Searching veterinary clinics and animal welfare organizations...
        </div>
      ) : !searched ? (
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-10 text-center space-y-2">
          <MapPin className="w-8 h-8 text-[#0F766E] mx-auto" />
          <h2 className="font-display text-base font-semibold text-[#111817]">
            Search for veterinary care near you
          </h2>
          <p className="text-sm text-[#4A5553] max-w-md mx-auto">
            Enter a city or click &ldquo;Use My Location&rdquo; to list verified nearby clinics, animal hospitals, and animal welfare shelters.
          </p>
        </div>
      ) : facilities.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8E2] p-10 text-center text-sm text-[#4A5553]">
          No mapped veterinary clinics matched within {radiusKm} km of {centerLabel}. Try expanding the radius to 25 km or switching the category filter to All.
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-[#4A5553]">
            Showing <span className="font-mono-tabular font-semibold">{facilities.length}</span> real listings near {centerLabel}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {facilities.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-[#E2E8E2] p-5 flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium text-[#0F766E]">{item.category}</p>
                      <h3 className="font-display text-base font-bold text-[#111817] mt-0.5">
                        {item.name}
                      </h3>
                    </div>
                    <span className="font-mono-tabular text-xs font-semibold text-[#111817] shrink-0">
                      {item.distanceKm} km
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5553] mt-2">{item.address}</p>
                  <div className="mt-3 space-y-1 text-xs text-[#4A5553]">
                    {item.phone && (
                      <p className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-[#0F766E]" />
                        <a href={`tel:${item.phone}`} className="hover:underline font-mono-tabular">
                          {item.phone}
                        </a>
                      </p>
                    )}
                    {item.openingHours && (
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#4A5553]" />
                        <span>{item.openingHours}</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E2E8E2] flex items-center justify-between gap-3">
                  {item.website ? (
                    <a
                      href={item.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-[#4A5553] hover:text-[#111817] inline-flex items-center gap-1"
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Website</span>
                    </a>
                  ) : (
                    <span className="text-xs text-[#64716E]">Phone/website not listed in OSM</span>
                  )}
                  <a
                    href={item.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-8 px-3 rounded-lg bg-[#0F766E] hover:bg-[#0D655E] text-white text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <span>Directions</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
