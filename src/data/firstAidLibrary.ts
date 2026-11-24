export interface FirstAidGuide {
  id: string;
  title: string;
  urgency: 'Urgent' | 'Emergency' | 'Monitor Closely';
  summary: string;
  safeSteps: string[];
  avoidActions: string[];
  emergencyWarnings: string[];
}

export const FIRST_AID_GUIDES: FirstAidGuide[] = [
  {
    id: 'cuts-wounds',
    title: 'Cuts & Minor Wounds',
    urgency: 'Monitor Closely',
    summary:
      'Superficial scrapes and small skin lacerations require gentle cleaning and protection from licking.',
    safeSteps: [
      'Stay calm and gently restrain your pet or have someone help hold them comfortably.',
      'Rinse the wound gently with sterile isotonic saline or clean lukewarm water to flush debris.',
      'Pat dry using a clean sterile gauze pad rather than rubbing.',
      'Apply a light non-stick sterile pad and cohesive wrap only if needed to keep clean until a vet check.',
      'Use an Elizabethan collar (cone) if your pet tries to lick or chew the area.',
    ],
    avoidActions: [
      'Do not apply hydrogen peroxide or rubbing alcohol, as both damage healing tissue.',
      'Do not apply human antibiotic creams unless specifically instructed by your veterinarian.',
      'Do not wrap a bandage tightly enough to cut off circulation or cause paw swelling.',
    ],
    emergencyWarnings: [
      'Gaping edges, visible muscle or bone, or wounds longer than 1.5 cm requiring sutures.',
      'Puncture wounds from animal bites (high infection risk even if the opening looks small).',
      'Foul odor, pus, spreading redness, or fever.',
    ],
  },
  {
    id: 'bleeding',
    title: 'Active Bleeding',
    urgency: 'Emergency',
    summary:
      'Controlling active hemorrhage with steady direct pressure is the top priority while preparing veterinary transport.',
    safeSteps: [
      'Place a thick pad of clean sterile gauze or a clean cloth directly over the bleeding site.',
      'Apply firm, steady direct pressure for at least 3 to 5 minutes without peeking repeatedly.',
      'If blood soaks through, place additional gauze directly on top rather than lifting the bottom layer.',
      'Keep your pet warm, quiet, and still during immediate transport to an animal hospital.',
    ],
    avoidActions: [
      'Do not apply a tourniquet unless explicitly guided by a veterinarian for life-threatening limb hemorrhage.',
      'Do not remove embedded objects (glass, sticks) from a deep wound—stabilize around them.',
      'Do not offer food or water if emergency anesthesia may be needed.',
    ],
    emergencyWarnings: [
      'Spurting bright red blood or bleeding that does not slow after 5 minutes of firm pressure.',
      'Pale or white gums, weakness, rapid breathing, or collapse.',
      'Bleeding from the nose, mouth, ears, or rectum.',
    ],
  },
  {
    id: 'burns',
    title: 'Thermal & Chemical Burns',
    urgency: 'Urgent',
    summary:
      'Prompt cooling with lukewarm or cool running water limits tissue damage; chemical burns require thorough flushing.',
    safeSteps: [
      'Move your pet away from the heat or chemical source safely.',
      'Flush the burned skin gently with cool (not ice-cold) running water for 10 to 15 minutes.',
      'For dry chemical powders, gently brush off loose particles with a gloved hand before rinsing.',
      'Cover the cooled area loosely with a clean, damp, non-stick sterile dressing for transport.',
    ],
    avoidActions: [
      'Never apply ice or freezing water directly to burned skin.',
      'Never apply butter, oils, ointments, or toothpaste to a burn.',
      'Do not pop blisters or peel adhered fur or fabric away from burned tissue.',
    ],
    emergencyWarnings: [
      'Burns covering a large body area, or burns on the face, paws, eyes, or airway.',
      'Smoke inhalation, coughing, hoarse barking/meowing, or labored breathing.',
      'Charred, leathery, or white skin.',
    ],
  },
  {
    id: 'choking',
    title: 'Choking & Airway Obstruction',
    urgency: 'Emergency',
    summary:
      'A pet pawing desperately at the mouth, gagging silently, or turning blue needs immediate emergency care.',
    safeSteps: [
      'If your pet can still breathe and cough forcefully, keep them calm and rush to the nearest vet.',
      'Carefully open the mouth only if safe to check for a clearly visible object you can sweep out with one finger.',
      'If a small dog or cat is unconscious and not breathing from a lodged object, hold upside down briefly or apply gentle upward abdominal thrusts just below the ribcage.',
      'Head straight to an emergency animal hospital even if the object dislodges, to check for throat trauma.',
    ],
    avoidActions: [
      'Do not reach blindly down the throat or push an object deeper.',
      'Never risk a severe bite if an awake, panicked pet is snapping—proceed straight to the vet.',
      'Do not give bread or water to "wash down" a stuck toy or bone.',
    ],
    emergencyWarnings: [
      'Blue, gray, or purple tongue or gums.',
      'Silent gagging with no air movement, collapse, or loss of consciousness.',
    ],
  },
  {
    id: 'poisoning',
    title: 'Suspected Poisoning & Toxic Ingestion',
    urgency: 'Emergency',
    summary:
      'Common toxins include chocolate, grapes/raisins, xylitol, lilies (deadly to cats), rodenticides, and human medications.',
    safeSteps: [
      'Remove your pet from the toxin source immediately and keep other pets away.',
      'Collect packaging, plant leaves, or a photo of the substance to bring to the veterinarian.',
      'Note the approximate amount ingested, your pet’s weight, and the time of exposure.',
      'Call your emergency veterinarian or an animal poison control hotline immediately before acting.',
    ],
    avoidActions: [
      'NEVER induce vomiting unless specifically instructed by a veterinarian (caustic chemicals and sharp items cause worse injury coming back up).',
      'Do not give milk, oil, salt water, or home remedies to "neutralize" poison.',
    ],
    emergencyWarnings: [
      'Vomiting, drooling, tremors, seizures, staggering, or sudden lethargy.',
      'Any lily ingestion or pollen exposure in cats—even small amounts can cause acute kidney failure.',
    ],
  },
  {
    id: 'insect-bites',
    title: 'Insect Bites & Stings',
    urgency: 'Monitor Closely',
    summary:
      'Most bee or wasp stings cause mild local swelling, but allergic reactions can escalate rapidly.',
    safeSteps: [
      'Inspect the site; if a bee stinger is visible, scrape it sideways out using a flat card edge.',
      'Apply a cool compress wrapped in a cloth for 10 minutes to ease localized swelling.',
      'Monitor your pet closely for at least 2 hours for facial swelling or hives.',
    ],
    avoidActions: [
      'Do not squeeze a stinger sac with tweezers, which can inject additional venom.',
      'Do not give human antihistamines or painkillers without veterinary dosing approval.',
    ],
    emergencyWarnings: [
      'Swelling of the muzzle, eyelids, throat, or tongue.',
      'Wheezing, noisy breathing, vomiting, pale gums, or sudden collapse (anaphylaxis).',
    ],
  },
  {
    id: 'fractures',
    title: 'Suspected Fractures & Trauma',
    urgency: 'Emergency',
    summary:
      'Falls, vehicle impacts, and sudden non-weight-bearing lameness require immobilization and immediate vet imaging.',
    safeSteps: [
      'Approach slowly; injured pets may bite out of fear or pain.',
      'Keep your pet flat and still on a rigid board, thick blanket, or sturdy carrier bottom during transport.',
      'Cover open fractures lightly with a sterile damp gauze pad without pushing bone back in.',
    ],
    avoidActions: [
      'Do not try to realign a bent limb or set a fracture at home.',
      'Do not wrap a rigid splint tightly—improper splints often worsen nerve and tissue injury.',
      'Never give human NSAIDs (ibuprofen, naproxen) or acetaminophen.',
    ],
    emergencyWarnings: [
      'Visible bone, severe limb deformity, inability to stand, or spinal/back pain.',
      'Any hit-by-car or high-rise fall trauma (internal bleeding may not show right away).',
    ],
  },
  {
    id: 'heatstroke',
    title: 'Heat-Related Emergencies (Heatstroke)',
    urgency: 'Emergency',
    summary:
      'Overheating can rapidly damage organs; controlled, gradual cooling while heading to the vet saves lives.',
    safeSteps: [
      'Move your pet immediately into shade or an air-conditioned space.',
      'Pour cool (not ice-cold) tap water over the body, belly, groin, and paw pads, and run a fan.',
      'Offer small sips of cool water only if your pet is alert and able to swallow normally.',
      'Stop active cooling once rectal temperature approaches 39.4°C (103°F) and transport to an emergency clinic.',
    ],
    avoidActions: [
      'Never submerge an overheated pet in ice water—ice constricts skin blood vessels and traps core heat.',
      'Do not drape wet towels fully over the back without airflow, which traps heat.',
      'Do not force water into the mouth of a dazed or vomiting pet.',
    ],
    emergencyWarnings: [
      'Frantic panting, thick ropy saliva, bright red or purple gums, wobbling, vomiting, diarrhea, or collapse.',
    ],
  },
];
