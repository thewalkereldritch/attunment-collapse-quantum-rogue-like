
export type EnemyArchetype = 'Stalker' | 'Weaver' | 'Bulwark' | 'Singularity' | 'Quantum-Phantom';

export interface Enemy {
  name: string;
  type: EnemyArchetype;
  integrity: number;
  maxIntegrity: number;
  description: string;
  lexicalSignature: string; // e.g., "MONO-ARCHON"
  weakness?: string; // e.g., "DIA-ROOTS"
  isEntangled?: boolean;
}

export type Rarity = 'Common' | 'Uncommon' | 'Rare' | 'Mythic' | 'Gnostic' | 'Quantum' | 'Legacy' | 'Cinematic';

export interface LegacyArtifact {
  name: string;
  rarity: Rarity;
  effect: string;
  essence: 'Legal' | 'Hermetic' | 'Biological' | 'Akashic' | 'Cinematic';
  description?: string;
}

export interface Morpheme {
  root: string;
  power: string;
  effect: string;
  originWord: string;
  rarity: Rarity;
  complexity: number;
}

export interface CanonEntry {
  title: string;
  desc: string;
  weakEnding?: string; // Cryptic clue about the director's "weakness"
  isUserGenerated?: boolean;
}

export interface GameState {
  integrity: number;
  maxIntegrity: number;
  will: number;
  maxWill: number;
  enlightenment: number;
  level: number;
  static: number;
  probabilityAmplitude: number;
  weirdnessSignature: number; // 0-100: Tracks how "non-consensus" the player's actions are
  threadCount: number; // 0-1000: The 'density' of reality the player is tracking
  conceptionLevel: number; // 0-10: Meta-awareness of the simulation's design
  npcMemories: string[]; // Stores specific past deeds or "weird" moments
  depth: number;
  stash: (string | LegacyArtifact)[];
  morphemes: Morpheme[]; 
  activeThreats: Enemy[];
  identity: string;
  status: 'playing' | 'gameover' | 'start' | 'courtroom';
  currentQuest?: string;
  legalHistory?: string[];
  currentCharges?: string;
  hasLens?: boolean;
  paperbacksFound: string[];
  discoveredCanon: CanonEntry[];
}

export interface GameResponse {
  narration: string;
  choices: string[];
  stateUpdate: Partial<GameState>;
  imagePrompt: string;
  memoryReferenced?: string; // The specific memory string being recalled by an NPC
  harvestResults?: {
    noveltyScore: number;
    rarity: Rarity;
    comment: string;
    artifact?: LegacyArtifact;
  };
}

export interface HistoryEntry {
  role: 'user' | 'ai';
  text: string;
  timestamp: number;
}
