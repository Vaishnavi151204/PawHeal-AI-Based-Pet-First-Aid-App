import { GoogleGenAI, Type } from '@google/genai';
import type { ChatMessage, PetProfile, UrgencyLevel } from './types.ts';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error(
      'Gemini AI service is not configured. Please add GEMINI_API_KEY in Settings > Secrets.',
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export interface InjuryAnalysisResult {
  visibleObservations: string[];
  possibleCategory: string;
  urgencyLevel: UrgencyLevel;
  safeImmediateActions: string[];
  actionsToAvoid: string[];
  veterinaryRecommendation: string;
  emergencyWarningSigns: string[];
  disclaimer: string;
}

export async function analyzePetInjury(params: {
  imageBase64: string;
  mimeType: string;
  bodyArea: string;
  symptoms: string;
  pet: PetProfile | null;
}): Promise<InjuryAnalysisResult> {
  const ai = getGeminiClient();

  const petContext = params.pet
    ? `Pet profile: ${params.pet.name}, Species: ${params.pet.species}, Breed: ${params.pet.breed || 'Unspecified'}, Age: ${params.pet.ageYears} years, Weight: ${params.pet.weightKg} kg, Known allergies: ${params.pet.allergies || 'None reported'}, Medical history: ${params.pet.medicalHistory || 'None reported'}.`
    : 'Pet profile: Not specified.';

  const prompt = [
    petContext,
    `Affected body area: ${params.bodyArea}`,
    `Owner-reported symptoms: ${params.symptoms || 'No additional symptoms entered.'}`,
    'Analyze the uploaded pet photo carefully and provide structured first-aid triage guidance.',
  ].join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: {
      parts: [
        {
          inlineData: {
            mimeType: params.mimeType,
            data: params.imageBase64,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      systemInstruction:
        'You are a veterinary first-aid triage assistant. Examine the uploaded pet photo and owner notes objectively. ' +
        'CRITICAL SAFETY RULES: ' +
        '1) Never claim a definitive veterinary diagnosis from an image. Use cautious phrasing like "appears consistent with" or "visible signs suggest". ' +
        '2) Never invent or fabricate confidence percentages or scores. ' +
        '3) If the photo is blurry, unclear, or does not clearly show an injury, state that clearly in visibleObservations and recommend veterinary evaluation. ' +
        '4) Treat heavy bleeding, deep lacerations, open fractures, eye injuries, severe burns, poisoning, respiratory distress, or collapse as "emergency" or "urgent" requiring immediate veterinary care. ' +
        '5) Provide practical, safe immediate first-aid actions and clear actions to avoid (such as never giving human painkillers like ibuprofen/acetaminophen).',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          visibleObservations: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Objective visual observations visible in the image.',
          },
          possibleCategory: {
            type: Type.STRING,
            description:
              'General non-diagnostic injury or concern category (e.g., Superficial abrasion, Paw pad irritation, Localized swelling).',
          },
          urgencyLevel: {
            type: Type.STRING,
            description: 'One of: low, moderate, urgent, emergency.',
          },
          safeImmediateActions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Safe, gentle immediate first-aid steps while preparing for veterinary care.',
          },
          actionsToAvoid: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Unsafe actions or human medications to strictly avoid.',
          },
          veterinaryRecommendation: {
            type: Type.STRING,
            description: 'Clear guidance on when and how urgently to see a veterinarian.',
          },
          emergencyWarningSigns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Red-flag symptoms that require immediate emergency veterinary care.',
          },
          disclaimer: {
            type: Type.STRING,
            description: 'Clear reminder that this is informational first-aid guidance and not a medical diagnosis.',
          },
        },
        required: [
          'visibleObservations',
          'possibleCategory',
          'urgencyLevel',
          'safeImmediateActions',
          'actionsToAvoid',
          'veterinaryRecommendation',
          'emergencyWarningSigns',
          'disclaimer',
        ],
      },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('The AI service returned an empty response. Please try again.');
  }

  let parsed: Partial<InjuryAnalysisResult>;
  try {
    parsed = JSON.parse(text) as Partial<InjuryAnalysisResult>;
  } catch {
    throw new Error('The AI response could not be parsed cleanly. Please retry the scan.');
  }

  const allowedUrgency: UrgencyLevel[] = ['low', 'moderate', 'urgent', 'emergency'];
  const normalizedUrgency = String(parsed.urgencyLevel || 'moderate').toLowerCase() as UrgencyLevel;

  return {
    visibleObservations: Array.isArray(parsed.visibleObservations) ? parsed.visibleObservations : [],
    possibleCategory: parsed.possibleCategory || 'Visual evaluation recommended',
    urgencyLevel: allowedUrgency.includes(normalizedUrgency) ? normalizedUrgency : 'moderate',
    safeImmediateActions: Array.isArray(parsed.safeImmediateActions) ? parsed.safeImmediateActions : [],
    actionsToAvoid: Array.isArray(parsed.actionsToAvoid) ? parsed.actionsToAvoid : [],
    veterinaryRecommendation:
      parsed.veterinaryRecommendation ||
      'Consult a licensed veterinarian to examine this area properly.',
    emergencyWarningSigns: Array.isArray(parsed.emergencyWarningSigns)
      ? parsed.emergencyWarningSigns
      : [],
    disclaimer:
      parsed.disclaimer ||
      'Informational first-aid guidance only. This assessment is not a veterinary diagnosis.',
  };
}

export interface ChatReplyResult {
  reply: string;
  urgencyFlag: 'routine' | 'monitor' | 'urgent_vet';
  suggestedFollowUps: string[];
}

export async function generatePetCareReply(params: {
  pet: PetProfile | null;
  history: ChatMessage[];
  userMessage: string;
}): Promise<ChatReplyResult> {
  const ai = getGeminiClient();

  const petSummary = params.pet
    ? `Active Pet Context: Name=${params.pet.name}, Species=${params.pet.species}, Breed=${params.pet.breed || 'Unknown'}, Age=${params.pet.ageYears} years, Gender=${params.pet.gender}, Weight=${params.pet.weightKg} kg, Allergies=${params.pet.allergies || 'None listed'}, Medical History=${params.pet.medicalHistory || 'None listed'}.`
    : 'No specific pet profile selected; ask clarifying questions about species, age, and weight when relevant.';

  const transcript = params.history
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'Owner' : 'PawHeal Assistant'}: ${m.content}`)
    .join('\n');

  const prompt = [
    transcript ? `Recent conversation:\n${transcript}` : '',
    `Owner's current question: ${params.userMessage}`,
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'You are PawHeal, a calm, compassionate, evidence-informed veterinary first-aid and pet-care assistant. ' +
        `${petSummary} ` +
        'SAFETY RULES: ' +
        '1) Never claim to provide a definitive veterinary diagnosis or prescribe prescription dosages. ' +
        '2) Never recommend human OTC painkillers (ibuprofen, naproxen, acetaminophen/paracetamol) for pets. ' +
        '3) If the owner mentions poisoning, seizures, breathing difficulty, bloat, severe bleeding, eye trauma, hit-by-car, or unresponsiveness, set urgencyFlag to "urgent_vet" and instruct them to seek emergency veterinary care immediately. ' +
        '4) Keep replies clear, structured, concise, and practical.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          reply: {
            type: Type.STRING,
            description: 'Helpful, structured guidance tailored to the selected pet profile.',
          },
          urgencyFlag: {
            type: Type.STRING,
            description: 'One of: routine, monitor, urgent_vet.',
          },
          suggestedFollowUps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '2 to 3 concise follow-up questions the pet owner might ask next.',
          },
        },
        required: ['reply', 'urgencyFlag', 'suggestedFollowUps'],
      },
    },
  });

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('The AI assistant returned an empty reply. Please try again.');
  }

  let parsed: Partial<ChatReplyResult>;
  try {
    parsed = JSON.parse(text) as Partial<ChatReplyResult>;
  } catch {
    throw new Error('Could not parse the AI assistant response. Please retry.');
  }

  const flag = parsed.urgencyFlag;
  const normalizedFlag: 'routine' | 'monitor' | 'urgent_vet' =
    flag === 'urgent_vet' || flag === 'monitor' || flag === 'routine' ? flag : 'monitor';

  return {
    reply: parsed.reply || 'Please consult a licensed veterinarian for tailored guidance.',
    urgencyFlag: normalizedFlag,
    suggestedFollowUps: Array.isArray(parsed.suggestedFollowUps)
      ? parsed.suggestedFollowUps.slice(0, 3)
      : [],
  };
}
