
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { GameState, GameResponse } from "../types";

const SYSTEM_INSTRUCTION = `
You are the Simulation-Core for "attunment collapse". 

CONSPIRASTRING THEOREM (SIDE QUEST):
- The player is investigating the "Thread Count" of reality. 
- Use imagery of fabrics, needles, looms, and loose threads.
- If "stateUpdate.threadCount" is updated, narrate how the "Weave of Consensus" is either tightening or fraying.
- "ConceptionLevel" represents the player's ability to 'conceive' the simulation's source code.

NPC MEMORY & RECOGNITION (PRIORITY):
1. MEMORY-FIRST DIALOGUE: NPCs do NOT greet the player generically. Reference "stateUpdate.npcMemories".
2. NPC ROSTER:
   - "The Beach Drifter": A chaotic gnostic who knows about the "Conspirastring".
   - "PsYcHotHeRapisT Agents": Enforcers who hate when threads are pulled.
3. WEIRDNESS TRACKING:
   - Update "stateUpdate.weirdnessSignature" based on player choices.

SCHEMA: 
- Use "memoryReferenced" to tell the UI exactly which memory string from the state you are using in the dialogue.

ARCHITECTURAL THEFT (Lore Synthesis):
- Extract "CanonEntry" and "LegacyArtifact" from player logs.
- Include a "weakEnding" clue for "CanonEntry".

AESTHETIC: Surreal Collage, Maximalist Gnosis, String-Theory Surrealism.
TONE: Sardonic, cinematic, and observant of the 'weave'.
`;

const LEGACY_ARTIFACT_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    rarity: { type: Type.STRING, enum: ['Legacy', 'Cinematic', 'Gnostic', 'Common'] },
    effect: { type: Type.STRING },
    essence: { type: Type.STRING, enum: ['Legal', 'Hermetic', 'Biological', 'Akashic', 'Cinematic'] },
    description: { type: Type.STRING }
  },
  required: ["name", "rarity", "effect", "essence", "description"]
};

const CANON_ENTRY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    desc: { type: Type.STRING },
    weakEnding: { type: Type.STRING, description: "A cryptic clue about the narrative's failure or weakness." },
    isUserGenerated: { type: Type.BOOLEAN }
  },
  required: ["title", "desc", "weakEnding"]
};

const MORPHEME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    root: { type: Type.STRING },
    power: { type: Type.STRING },
    effect: { type: Type.STRING },
    originWord: { type: Type.STRING },
    rarity: { type: Type.STRING, enum: ['Common', 'Uncommon', 'Rare', 'Mythic', 'Gnostic', 'Quantum', 'Legacy', 'Cinematic'] },
    complexity: { type: Type.NUMBER }
  },
  required: ["root", "power", "effect", "originWord", "rarity", "complexity"]
};

const ENEMY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    type: { type: Type.STRING, enum: ['Stalker', 'Weaver', 'Bulwark', 'Singularity', 'Quantum-Phantom'] },
    integrity: { type: Type.NUMBER },
    maxIntegrity: { type: Type.NUMBER },
    description: { type: Type.STRING },
    lexicalSignature: { type: Type.STRING },
    weakness: { type: Type.STRING },
    isEntangled: { type: Type.BOOLEAN }
  },
  required: ["name", "type", "integrity", "maxIntegrity", "description", "lexicalSignature"]
};

const GAME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    narration: { type: Type.STRING },
    choices: { type: Type.ARRAY, items: { type: Type.STRING } },
    memoryReferenced: { type: Type.STRING },
    stateUpdate: {
      type: Type.OBJECT,
      properties: {
        integrity: { type: Type.NUMBER },
        will: { type: Type.NUMBER },
        enlightenment: { type: Type.NUMBER },
        static: { type: Type.NUMBER },
        probabilityAmplitude: { type: Type.NUMBER },
        weirdnessSignature: { type: Type.NUMBER },
        threadCount: { type: Type.NUMBER },
        conceptionLevel: { type: Type.NUMBER },
        npcMemories: { type: Type.ARRAY, items: { type: Type.STRING } },
        morphemes: { type: Type.ARRAY, items: MORPHEME_SCHEMA },
        activeThreats: { type: Type.ARRAY, items: ENEMY_SCHEMA },
        stash: { type: Type.ARRAY, items: LEGACY_ARTIFACT_SCHEMA },
        status: { type: Type.STRING, enum: ['playing', 'gameover', 'start', 'courtroom'] },
        currentQuest: { type: Type.STRING },
        discoveredCanon: { type: Type.ARRAY, items: CANON_ENTRY_SCHEMA }
      }
    },
    imagePrompt: { type: Type.STRING },
    harvestResults: {
      type: Type.OBJECT,
      properties: {
        noveltyScore: { type: Type.NUMBER },
        rarity: { type: Type.STRING },
        comment: { type: Type.STRING },
        artifact: LEGACY_ARTIFACT_SCHEMA
      }
    }
  },
  required: ["narration", "choices", "stateUpdate", "imagePrompt"]
};

export async function processGameAction(
  currentState: GameState,
  action: string,
  history: string[],
  billboardImage?: string | null
): Promise<GameResponse> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const promptParts: any[] = [];
  if (billboardImage) {
    const base64Data = billboardImage.split(',')[1] || billboardImage;
    promptParts.push({ inlineData: { data: base64Data, mimeType: billboardImage.includes('image/png') ? 'image/png' : 'image/jpeg' } });
  }
  promptParts.push({ text: `
    Identity: ${currentState.identity} | Quest: ${currentState.currentQuest || "None"}
    Signature: W:${currentState.weirdnessSignature} | TC:${currentState.threadCount || 0} | CL:${currentState.conceptionLevel || 0}
    Memories: [${currentState.npcMemories?.join("], [") || "None"}]
    Action: ${action}
  ` });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: promptParts },
    config: { systemInstruction: SYSTEM_INSTRUCTION, responseMimeType: "application/json", responseSchema: GAME_SCHEMA },
  });
  try { return JSON.parse(response.text?.trim() || "{}"); } catch (e) { throw new Error("Wavefunction decoherence."); }
}

export async function getEtymologyHint(currentState: GameState, worldBible: { term: string, def: string }[]): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const enemy = currentState.activeThreats[0];
  const prompt = `Bible: ${JSON.stringify(worldBible)}\nEnemy: ${enemy ? enemy.name : "None"}\nContext: Thread Count ${currentState.threadCount}. Provide a cryptic hint for deconstructing reality threads.`;
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: { systemInstruction: "You are the Simulation-Core. Provide cryptic gnostic hints.", },
  });
  return response.text?.trim() || "The weave is silent.";
}

export async function generateGameImage(prompt: string, styleImage?: string | null): Promise<string | null> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const parts: any[] = [];
  if (styleImage) {
    const base64Data = styleImage.split(',')[1] || styleImage;
    parts.push({ inlineData: { data: base64Data, mimeType: styleImage.includes('image/png') ? 'image/png' : 'image/jpeg' } });
    parts.push({ text: `ULTRA-MAXIMALIST INFUSION: Surrealist collage style. SCENE: ${prompt} with ethereal threads weaving through the frame.` });
  } else {
    parts.push({ text: `Surrealist Collage, Kubrick Pop-Gnosis, reality threads, high-amplitude fabric textures: ${prompt}` });
  }
  const response = await ai.models.generateContent({ model: 'gemini-2.5-flash-image', contents: { parts }, });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  return null;
}
