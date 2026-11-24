class FirstAidGuide {
  const FirstAidGuide({
    required this.id,
    required this.title,
    required this.urgency,
    required this.safeSteps,
    required this.avoidActions,
    required this.emergencyWarnings,
  });

  final String id;
  final String title;
  final String urgency;
  final List<String> safeSteps;
  final List<String> avoidActions;
  final List<String> emergencyWarnings;
}

const List<FirstAidGuide> curatedFirstAidGuides = [
  FirstAidGuide(
    id: 'cuts',
    title: 'Cuts & Wounds',
    urgency: 'Monitor Closely',
    safeSteps: [
      'Rinse gently with sterile saline or clean lukewarm water.',
      'Pat dry with sterile gauze and prevent licking with an Elizabethan collar.',
    ],
    avoidActions: [
      'Do not apply hydrogen peroxide or rubbing alcohol.',
      'Do not wrap bandages tightly enough to restrict circulation.',
    ],
    emergencyWarnings: ['Gaping wounds, animal bite punctures, or active pus.'],
  ),
  FirstAidGuide(
    id: 'bleeding',
    title: 'Bleeding',
    urgency: 'Emergency',
    safeSteps: [
      'Apply steady direct pressure with clean gauze for 3-5 minutes.',
      'Add extra pads on top if soaked rather than lifting the initial pad.',
    ],
    avoidActions: ['Do not remove embedded objects from deep wounds.'],
    emergencyWarnings: ['Spurting blood, pale gums, or bleeding after 5 minutes of pressure.'],
  ),
  FirstAidGuide(
    id: 'burns',
    title: 'Burns',
    urgency: 'Urgent',
    safeSteps: ['Flush gently with cool (not icy) running water for 10-15 minutes.'],
    avoidActions: ['Never apply ice, butter, or human ointments.'],
    emergencyWarnings: ['Burns on face, paws, airway, or smoke inhalation.'],
  ),
  FirstAidGuide(
    id: 'choking',
    title: 'Choking',
    urgency: 'Emergency',
    safeSteps: ['Keep pet calm and seek immediate emergency veterinary removal.'],
    avoidActions: ['Do not blindly push fingers down a snapping pet throat.'],
    emergencyWarnings: ['Blue/gray gums, silent gagging, or collapse.'],
  ),
  FirstAidGuide(
    id: 'poisoning',
    title: 'Poisoning',
    urgency: 'Emergency',
    safeSteps: ['Save packaging/plant samples and call an emergency vet immediately.'],
    avoidActions: ['Never induce vomiting without veterinary instruction.'],
    emergencyWarnings: ['Tremors, seizures, drooling, or lily exposure in cats.'],
  ),
  FirstAidGuide(
    id: 'insect_bites',
    title: 'Insect Bites',
    urgency: 'Monitor Closely',
    safeSteps: ['Scrape visible stinger sideways and apply a wrapped cool compress.'],
    avoidActions: ['Do not give human antihistamines without vet dosing.'],
    emergencyWarnings: ['Facial swelling, hives, wheezing, or collapse.'],
  ),
  FirstAidGuide(
    id: 'fractures',
    title: 'Fractures',
    urgency: 'Emergency',
    safeSteps: ['Keep pet flat and still on a rigid board or sturdy carrier during transport.'],
    avoidActions: ['Never try to realign limbs or administer human painkillers.'],
    emergencyWarnings: ['Visible bone, spinal pain, or hit-by-car trauma.'],
  ),
  FirstAidGuide(
    id: 'heatstroke',
    title: 'Heat-Related Emergencies',
    urgency: 'Emergency',
    safeSteps: ['Move to shade/AC and pour cool tap water over body and paws with airflow.'],
    avoidActions: ['Never submerge in ice water.'],
    emergencyWarnings: ['Frantic panting, bright red gums, vomiting, or wobbling.'],
  ),
];
