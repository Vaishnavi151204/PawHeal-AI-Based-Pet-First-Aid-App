import { useMemo, useState } from 'react';
import { AlertOctagon, CheckCircle2, Search, ShieldAlert } from 'lucide-react';
import { FIRST_AID_GUIDES } from '../data/firstAidLibrary';

export function FirstAidView() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(FIRST_AID_GUIDES[0].id);

  const filteredGuides = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FIRST_AID_GUIDES;
    return FIRST_AID_GUIDES.filter(
      (g) =>
        g.title.toLowerCase().includes(q) ||
        g.summary.toLowerCase().includes(q) ||
        g.safeSteps.some((s) => s.toLowerCase().includes(q)),
    );
  }, [query]);

  const activeGuide =
    filteredGuides.find((g) => g.id === selectedId) ?? filteredGuides[0] ?? FIRST_AID_GUIDES[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch bg-white rounded-2xl border border-[#E2E8E2] overflow-hidden">
        <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-center">
          <p className="text-xs font-semibold text-[#0F766E] mb-1">Curated First-Aid Reference</p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#111817]">
            Pet First-Aid Library
          </h1>
          <p className="text-sm text-[#4A5553] mt-2 leading-relaxed max-w-xl">
            Step-by-step stabilization guidance for common emergencies. Always follow up with a licensed veterinarian after providing initial first aid.
          </p>
          <div className="mt-5 relative max-w-md">
            <Search className="w-4 h-4 text-[#64716E] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cuts, bleeding, poisoning, heatstroke..."
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-[#D4DDD4] text-sm focus:outline-none focus:ring-2 focus:ring-[#0F766E]/30 focus:border-[#0F766E]"
            />
          </div>
        </div>
        <div className="lg:col-span-5 min-h-[180px] bg-[#EEF1EE]">
          <img
            src="/src/assets/images/first_aid_kit_banner_1795541849657.jpg"
            alt="Pet first-aid supplies including sterile gauze, saline wash, digital thermometer, and cohesive wrap"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <aside className="lg:col-span-4 space-y-2">
          {filteredGuides.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#E2E8E2] p-5 text-sm text-[#4A5553]">
              No matching first-aid topic found. Clear the search bar to see all 8 guides.
            </div>
          ) : (
            filteredGuides.map((guide) => {
              const isSelected = activeGuide.id === guide.id;
              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => setSelectedId(guide.id)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-white border-[#0F766E] text-[#111817]'
                      : 'bg-white border-[#E2E8E2] text-[#4A5553] hover:border-[#B6C4B6]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-display text-sm font-semibold text-[#111817]">
                      {guide.title}
                    </span>
                    <span
                      className={`text-xs font-semibold shrink-0 ${
                        guide.urgency === 'Emergency'
                          ? 'text-red-700'
                          : guide.urgency === 'Urgent'
                            ? 'text-amber-700'
                            : 'text-[#0F766E]'
                      }`}
                    >
                      {guide.urgency}
                    </span>
                  </div>
                  <p className="text-xs text-[#4A5553] mt-1 line-clamp-2">{guide.summary}</p>
                </button>
              );
            })
          )}
        </aside>

        <article className="lg:col-span-8 bg-white rounded-xl border border-[#E2E8E2] p-6 sm:p-8 space-y-6">
          <div className="pb-4 border-b border-[#E2E8E2]">
            <p
              className={`text-xs font-semibold mb-1 ${
                activeGuide.urgency === 'Emergency'
                  ? 'text-red-700'
                  : activeGuide.urgency === 'Urgent'
                    ? 'text-amber-700'
                    : 'text-[#0F766E]'
              }`}
            >
              Priority Level: {activeGuide.urgency}
            </p>
            <h2 className="font-display text-2xl font-bold text-[#111817]">{activeGuide.title}</h2>
            <p className="text-sm text-[#4A5553] mt-2 leading-relaxed">{activeGuide.summary}</p>
          </div>

          <div>
            <h3 className="font-display text-base font-semibold text-[#111817] flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-4 h-4 text-[#15803D]" />
              <span>Safe Immediate Instructions</span>
            </h3>
            <ol className="space-y-2.5 text-sm text-[#111817]">
              {activeGuide.safeSteps.map((step, idx) => (
                <li key={step} className="flex items-start gap-3">
                  <span className="font-mono-tabular text-xs font-semibold text-[#0F766E] mt-0.5 shrink-0">
                    0{idx + 1}.
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <div className="pt-4 border-t border-[#E2E8E2]">
            <h3 className="font-display text-base font-semibold text-[#111817] flex items-center gap-2 mb-3">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span>Dangerous Actions to Avoid</span>
            </h3>
            <ul className="space-y-2 text-sm text-[#4A5553]">
              {activeGuide.avoidActions.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="text-amber-700 font-bold" aria-hidden="true">
                    ×
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/70 p-4">
            <h3 className="font-display text-sm font-semibold text-red-900 flex items-center gap-2 mb-2">
              <AlertOctagon className="w-4 h-4 text-red-700" />
              <span>Emergency Warning Signs — Seek Immediate Vet Care</span>
            </h3>
            <ul className="space-y-1.5 text-sm text-red-900/90">
              {activeGuide.emergencyWarnings.map((warn) => (
                <li key={warn}>• {warn}</li>
              ))}
            </ul>
          </div>
        </article>
      </div>
    </div>
  );
}
