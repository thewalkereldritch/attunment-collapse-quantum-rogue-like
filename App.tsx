
import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, Radio, Trash2, Cpu, Layers, Archive, Terminal, RefreshCcw, 
  Eye, Crosshair, Send, Lock, BatteryMedium, Sparkles, Book, 
  Scissors, Wand2, Quote, X, Sword, Trophy, Star, Atom, Infinity,
  BookOpen, Search, Command, Link as LinkIcon, Edit3, Check, RotateCcw,
  Scale, Flame, Wind, Briefcase, Tent, Waves, Building2, Ghost, ShieldAlert,
  Sun, Umbrella, Map as MapIcon, Compass, Hammer, Gavel, Scale as ScaleIcon,
  ShieldCheck, FileText, Landmark, ScrollText, Anchor, Camera, Clapperboard,
  Film, Library, ChevronRight, Sparkle, Mic, MicOff, Volume2, Loader2,
  Box, Dna, Hexagon, Activity, Signal, MessageSquareQuote, History, Clapperboard as MovieIcon,
  Image as ImageIcon, Palette, Eraser, Maximize2, Monitor, Crown, Sparkles as SparklesIcon,
  Shapes, Triangle, Target, ZapOff, Fingerprint, Bug, Waves as WaveIcon, PenTool, BrainCircuit,
  MessageCircle, HelpCircle, AlertCircle, Scissors as StitchIcon, GitBranch, Share2
} from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { GameState, HistoryEntry, Morpheme, Rarity, LegacyArtifact, CanonEntry, Enemy, GameResponse } from './types';
import { processGameAction, generateGameImage, getEtymologyHint } from './services/geminiService';

const KUBRICK_CANON: CanonEntry[] = [
  { 
    title: "The Shining", 
    desc: "Adored like a child by the director's lens. The context of the maze is the soul of the work.", 
    weakEnding: "FROZEN ISOLATION" 
  },
  { 
    title: "Lolita", 
    desc: "Adored for its moral complexity. A tragedy of the context.", 
    weakEnding: "HOSPITAL WARD FINALE" 
  },
  { 
    title: "A Clockwork Orange", 
    desc: "The 'cured' Alex returns to the loop. Loved for its symmetry.", 
    weakEnding: "WEAK SURRENDER LOOP" 
  },
  { 
    title: "2001: A Space Odyssey", 
    desc: "Evolution into an alien silence. The ultimate context.", 
    weakEnding: "STARCHILD SILENCE" 
  },
];

const INITIAL_LORE = [
  { term: "The Pentad Towers", def: "Five glass monoliths of the elite. They broadcast the 'Consensus Frequency'.", original: true },
  { term: "The Psy Herald", def: "A false Demiurge, rhythmic and distracting. Psy (Gangnam) is a fake frequency.", original: true },
  { term: "The Wave-Sized Demi", def: "The true Demiurge. An entity of pure humidity and swollen frequency.", original: true },
  { term: "Zeiss 0.7 Lens", def: "A NASA-grade optic. It captures the 'Illuminated' in candle-light.", original: true },
  { term: "Conspirastring Theorem", def: "The study of the physical threads that bind consensus reality into a singular fabric.", original: true },
];

const RITUAL_COMPONENTS = {
  prefixes: ["DIA", "EPI", "HYPO", "META", "PARA", "TRANS", "CYBER", "PAN"],
  symbols: ["🚫", "⚛️", "🌀", "💀", "👁️", "⚔️", "💎", "⚡"],
  roots: ["GnOsiS", "PhOsiS", "CrAtos", "Logos", "ScOpia", "ThEar", "Morph", "Nomos"]
};

const INITIAL_STATE: GameState = {
  integrity: 100, maxIntegrity: 100,
  will: 50, maxWill: 50,
  enlightenment: 0, level: 1,
  static: 0, probabilityAmplitude: 50,
  weirdnessSignature: 15,
  threadCount: 120,
  conceptionLevel: 1,
  npcMemories: [],
  depth: 0, stash: [],
  morphemes: [],
  activeThreats: [],
  identity: "The Living Soul",
  status: 'start',
  currentQuest: "Follow the Loose Thread in the Salt-Field",
  hasLens: false,
  paperbacksFound: [],
  discoveredCanon: []
};

// AUDIO HELPERS
function encode(bytes: Uint8Array): string {
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunk)));
  }
  return btoa(binary);
}

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showBible, setShowBible] = useState(false);
  const [showAltar, setShowAltar] = useState(false);
  const [showCanon, setShowCanon] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [logContent, setLogContent] = useState("");
  const [viewingArtifact, setViewingArtifact] = useState<LegacyArtifact | null>(null);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [styleReference, setStyleReference] = useState<string | null>(null);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [lastHarvest, setLastHarvest] = useState<GameResponse['harvestResults'] | null>(null);
  const [activeMemoryRecalled, setActiveMemoryRecalled] = useState<string | null>(null);
  const [hintText, setHintText] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  
  const [ritualParts, setRitualParts] = useState({ pre: "", sym: "", root: "" });
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveSessionRef = useRef<any>(null);
  const audioContexts = useRef<{input: AudioContext | null, output: AudioContext | null}>({input: null, output: null});
  const etherealCtx = useRef<AudioContext | null>(null);

  const initEtherealAudio = () => {
    if (!etherealCtx.current) {
      etherealCtx.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      setAudioInitialized(true);
    }
  };

  const playEtherealSound = (freq: number = 440, duration: number = 3) => {
    if (!etherealCtx.current || etherealCtx.current.state === 'suspended') return;
    const ctx = etherealCtx.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.98, ctx.currentTime + duration);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(freq * 0.5, ctx.currentTime + duration);
    filter.Q.setValueAtTime(10, ctx.currentTime);
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.05, ctx.currentTime + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const handleResponse = async (response: GameResponse) => {
    const newState = { 
      ...gameState, ...response.stateUpdate,
      stash: [...gameState.stash, ...(response.stateUpdate.stash || [])],
      discoveredCanon: [...gameState.discoveredCanon, ...(response.stateUpdate.discoveredCanon || [])],
      npcMemories: [...(gameState.npcMemories || []), ...(response.stateUpdate.npcMemories || [])],
      status: response.stateUpdate.status || (response.stateUpdate.integrity && response.stateUpdate.integrity <= 0 ? 'gameover' : 'playing')
    } as GameState;

    if (response.memoryReferenced) {
      setActiveMemoryRecalled(response.memoryReferenced);
      playEtherealSound(330, 4);
      setTimeout(() => setActiveMemoryRecalled(null), 6000);
    }

    if (response.harvestResults) {
      setLastHarvest(response.harvestResults);
      playEtherealSound(550, 4);
      setTimeout(() => setLastHarvest(null), 8000);
    }

    setGameState(newState);
    setCurrentChoices(response.choices || ["Follow the Thread", "Check the Stitch Count", "Speak to the Weaver"]);
    setHistory(prev => [...prev, { role: 'ai', text: response.narration, timestamp: Date.now() }]);
    
    setImageLoading(true);
    const img = await generateGameImage(response.imagePrompt, styleReference);
    setCurrentImage(img);
    setImageLoading(false);
  };

  const handleAction = async (action: string) => {
    initEtherealAudio();
    if (loading || gameState.status === 'gameover') return;
    setLoading(true);
    setHintText(null);
    if (!action.startsWith('[RITUAL') && !action.startsWith('[ARCHITECT')) {
      setHistory(prev => [...prev, { role: 'user', text: action, timestamp: Date.now() }]);
    }
    try {
      const response = await processGameAction(gameState, action, history.slice(-5).map(h => h.text), styleReference);
      await handleResponse(response);
    } catch (e: any) {
      setHistory(prev => [...prev, { role: 'ai', text: "THREAD COLLAPSE: " + e.message, timestamp: Date.now() }]);
    } finally {
      setLoading(false);
      setInputValue("");
    }
  };

  const fetchHint = async () => {
    if (hintLoading) return;
    initEtherealAudio();
    setHintLoading(true);
    playEtherealSound(330, 1);
    try {
      const hint = await getEtymologyHint(gameState, INITIAL_LORE);
      setHintText(hint);
    } catch (e) {
      setHintText("The tapestry is too complex...");
    } finally {
      setHintLoading(false);
    }
  };

  const toggleVoiceMode = async () => {
    initEtherealAudio();
    if (isVoiceActive) {
      if (liveSessionRef.current) liveSessionRef.current.close();
      setIsVoiceActive(false);
      return;
    }
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const inCtx = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 16000});
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            const source = inCtx.createMediaStreamSource(stream);
            const scriptProcessor = inCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                const s = Math.max(-1, Math.min(1, inputData[i]));
                int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              const pcmBlob = { data: encode(new Uint8Array(int16.buffer)), mimeType: 'audio/pcm;rate=16000' };
              sessionPromise.then(s => s.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inCtx.destination);
            setIsVoiceActive(true);
            setLoading(false);
          },
          onmessage: async () => {},
          onclose: () => setIsVoiceActive(false),
          onerror: () => setIsVoiceActive(false)
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: "You are the Simulation-Core. Observe the conspirastring theorem."
        }
      });
      liveSessionRef.current = await sessionPromise;
    } catch (e) {
      setLoading(false);
      setIsVoiceActive(false);
    }
  };

  const formatNarration = (text: string) => {
    const words = text.split(/\s+/);
    return words.map((word, i) => {
      const isBold = word.toUpperCase() === word && word.length > 3;
      const isArtifact = gameState.stash.some(a => typeof a !== 'string' && a.name.toLowerCase() === word.toLowerCase().replace(/[.,!?;:]/g, ''));
      return (
        <span 
          key={i} 
          onClick={() => setSelectedWord(word)} 
          className={`inline-block mx-1 cursor-pointer transition-all duration-300 relative group 
            ${isBold ? 'font-black text-white underline decoration-magenta-900 scale-105' : 
              isArtifact ? 'legacy-artifact text-yellow-400 scale-110 font-black' :
              'hover:text-cyan-400'}`}
        >
          {word.replace(/\[\[|\]\]/g, '')}
        </span>
      );
    });
  };

  const currentEnemy = gameState.activeThreats?.[0];
  const fullCanon = [...KUBRICK_CANON, ...gameState.discoveredCanon];
  const canonProgress = (gameState.discoveredCanon.length / 5) * 100;

  if (gameState.status === 'start') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 selection:bg-cyan-900 overflow-hidden relative" onClick={initEtherealAudio}>
        <div className="sun-flare" />
        <div className="heat-haze-overlay" />
        <div className="max-w-5xl w-full text-center space-y-12 animate-in fade-in zoom-in duration-1000 relative z-10">
          <div className="relative group">
            <h1 className="text-6xl md:text-[8rem] font-mono text-white tracking-tighter font-black uppercase italic leading-none relative z-10">
              attunment<br/>
              <span className="text-cyan-400 mix-blend-screen drop-shadow-[0_0_30px_rgba(0,255,255,0.5)]">collapse</span>
            </h1>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-30">
            <IdentityCard name="The Director" icon={<MovieIcon className="w-8 h-8"/>} desc="Control the lens. Synthesize Lore. Steal Reality." onClick={() => { setShowTos(true); }} />
            <IdentityCard name="Vessel-Owner" icon={<Anchor className="w-8 h-8"/>} desc="Declare independence. Refuse the Frequency." onClick={() => { setShowTos(true); }} />
            <IdentityCard name="Lens-Seeker" icon={<Camera className="w-8 h-8"/>} desc="Seek the Zeiss 0.7. See the Illuminated." onClick={() => { setShowTos(true); }} />
          </div>
        </div>
        {showTos && (
          <div className="fixed inset-0 bg-black/98 z-[100] flex items-center justify-center p-8 backdrop-blur-3xl animate-in zoom-in duration-700">
             <div className="max-w-2xl w-full bg-zinc-950 border-4 border-yellow-900/40 p-12 rounded-[3rem] shadow-[0_0_100px_rgba(234,179,8,0.2)] text-center">
                <ShieldCheck className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
                <h3 className="text-3xl font-cinzel font-black uppercase text-white mb-6 tracking-widest italic">Quantum Consent Agreement</h3>
                <div className="text-[11px] font-mono text-zinc-500 text-left space-y-4 mb-8 h-64 overflow-y-auto pr-4 leading-relaxed uppercase tracking-tighter">
                  <p>1. THE ARCHITECT (PLAYER) ACCEPTS FULL RESPONSIBILITY FOR THE WEIRDNESS SIGNATURE GENERATED BY THEIR ACTIONS.</p>
                  <p>2. NPC MEMORY IS PERSISTENT. IF YOU ARE WEIRD TO THE "WEAVER", HE WILL REMEMBER YOU AS THE "WEIRD THREAD".</p>
                  <p>3. REALITY IS A FABRIC. PULLING ON THE CONSPIRASTRING IS A VOLUNTARY ACT OF DECOHERENCE.</p>
                </div>
                <button onClick={() => handleAction("I AM INDEPENDENT. I ACCEPT THE QUANTUM TERMS.")} className="w-full py-6 bg-yellow-500 text-black font-black uppercase tracking-[0.5em] rounded-full hover:bg-white transition-all shadow-2xl">I AM INDEPENDENT</button>
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div 
      className={`h-screen flex flex-col md:flex-row text-zinc-300 font-mono overflow-hidden selection:bg-cyan-900/50 relative transition-colors duration-1000 bg-[#010101] dynamic-world`}
      style={{ 
        '--weirdness': gameState.weirdnessSignature / 100,
        '--thread-density': (gameState.threadCount || 0) / 1000
      } as React.CSSProperties}
    >
      <div className={`sun-flare`} />
      <div className="heat-haze-overlay opacity-30" />
      <div className="string-weave" />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] z-50 animate-pulse" />
      {gameState.probabilityAmplitude > 70 && <div className="scanline" />}
      
      <aside className={`w-full md:w-80 border-r border-zinc-900 p-6 flex flex-col gap-4 overflow-y-auto relative z-20 backdrop-blur-3xl bg-black/60`}>
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 relative">
          <Triangle className={`w-6 h-6 text-yellow-500 fill-current ${activeMemoryRecalled ? 'animate-ping text-white' : ''}`} />
          <div className="flex flex-col">
            <h2 className={`text-[12px] font-black text-white uppercase italic tracking-tighter leading-none ${activeMemoryRecalled ? 'probability-cloud' : ''}`}>{gameState.identity}</h2>
            <span className="text-[8px] text-zinc-500 mt-1 uppercase tracking-widest">UNRETROFIED ARCHITECT</span>
          </div>
        </div>

        <div className="space-y-4">
          <StatBar label="Soul Integrity" value={gameState.integrity} max={gameState.maxIntegrity} color="bg-emerald-600" />
          
          <div className="pt-2 space-y-1.5 group">
            <div className="flex justify-between text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em] group-hover:text-magenta-400 transition-colors">
              <span className={gameState.weirdnessSignature > 75 ? 'probability-cloud text-magenta-500' : ''}>Weirdness Signature</span>
              <span className="text-white">{gameState.weirdnessSignature}/100</span>
            </div>
            <div className="h-1 bg-zinc-900 rounded-full overflow-hidden relative">
              <div className="h-full bg-magenta-600 transition-all duration-1000" style={{ width: `${gameState.weirdnessSignature}%` }} />
            </div>
          </div>

          <div className="pt-2 space-y-1.5 group border-t border-zinc-900/40 pt-4">
            <div className="flex justify-between text-[8px] text-cyan-600 font-black uppercase tracking-[0.2em] group-hover:text-cyan-400 transition-colors">
              <span>Thread Count (Reality Density)</span>
              <span className="text-white">{gameState.threadCount || 0}/1000</span>
            </div>
            <div className="h-1.5 bg-zinc-900 rounded-full overflow-hidden relative border border-cyan-900/30">
              <div className="h-full bg-cyan-500 transition-all duration-1000 shadow-[0_0_10px_rgba(6,182,212,0.5)]" style={{ width: `${((gameState.threadCount || 0) / 1000) * 100}%` }} />
            </div>
            <p className="text-[6px] text-zinc-600 uppercase italic tracking-widest mt-1">Conception Level: {gameState.conceptionLevel || 0}</p>
          </div>
        </div>

        {currentEnemy && (
          <div className="p-4 bg-red-950/20 border-2 border-red-900/40 rounded-2xl space-y-3 animate-pulse">
            <StatBar label={currentEnemy.name} value={currentEnemy.integrity} max={currentEnemy.maxIntegrity} color="bg-red-600" />
          </div>
        )}

        <div className="space-y-3 pt-2">
          <div className="text-zinc-500 text-[9px] font-black uppercase tracking-[0.3em] border-b border-zinc-900 pb-1 italic flex items-center gap-2"><Shapes className="w-3 h-3" /> Synthesis Tools</div>
          
          <button onClick={() => handleAction("[RITUAL CONSTRUCTION]: Stitch Reality Threads")} className="w-full flex items-center gap-3 bg-cyan-950/10 p-3 rounded-xl border border-cyan-900/40 hover:border-cyan-500 transition-all group">
            <GitBranch className="w-4 h-4 text-cyan-500 group-hover:scale-110 transition-transform" />
            <p className="text-[9px] text-cyan-500 font-black uppercase tracking-widest italic">Stitch Reality</p>
          </button>

          <button onClick={() => setShowLog(true)} className="w-full flex items-center gap-3 bg-yellow-900/10 p-3 rounded-xl border border-yellow-900/40 hover:border-yellow-500 transition-all group">
            <PenTool className="w-4 h-4 text-yellow-500 group-hover:rotate-12 transition-transform" />
            <p className="text-[9px] text-yellow-500 font-black uppercase tracking-widest italic">Architect's Log</p>
          </button>
          
          <div className={`p-2 bg-black/40 border rounded-lg transition-colors ${activeMemoryRecalled ? 'border-yellow-500 bg-yellow-900/10' : 'border-zinc-900'}`}>
             <div className="flex items-center gap-2 mb-1">
               <BrainCircuit className={`w-3 h-3 ${activeMemoryRecalled ? 'text-yellow-500 animate-pulse' : 'text-cyan-500'}`} />
               <p className={`text-[7px] font-black uppercase tracking-widest ${activeMemoryRecalled ? 'text-yellow-500' : 'text-cyan-500'}`}>NPC Memories</p>
             </div>
             <div className="h-20 overflow-y-auto space-y-1 scrollbar-hide">
               {(gameState.npcMemories || []).slice().reverse().map((mem, i) => (
                 <p key={i} className={`text-[6px] uppercase italic border-l pl-1 leading-tight transition-all ${mem === activeMemoryRecalled ? 'text-yellow-400 border-yellow-400 font-black scale-105' : 'text-zinc-500 border-zinc-800'}`}>{mem}</p>
               ))}
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 pt-2">
          <button onClick={() => setShowBible(true)} className="flex items-center gap-3 bg-zinc-900/30 p-2.5 rounded-xl border border-yellow-900/20 hover:border-yellow-500 transition-all group">
            <BookOpen className="w-4 h-4 text-yellow-500" />
            <p className="text-[9px] text-yellow-500 font-black uppercase tracking-widest italic">The World Bible</p>
          </button>
          <button onClick={() => setShowCanon(true)} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-zinc-800 hover:border-white transition-all group">
            <Library className="w-4 h-4 text-white" />
            <p className="text-[9px] text-white font-black uppercase tracking-widest italic">Director's Canon</p>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[#050505]">
        {activeMemoryRecalled && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-2 duration-500">
             <div className="bg-white/95 text-black px-6 py-2 rounded-full border-2 border-yellow-500 shadow-[0_0_40px_rgba(255,255,255,0.4)] flex items-center gap-3">
               <MessageCircle className="w-4 h-4 text-yellow-600 animate-bounce" />
               <span className="text-[10px] font-black uppercase tracking-widest">Interaction Signature Recognized</span>
             </div>
          </div>
        )}

        <div className="relative w-full border-b border-zinc-900 bg-zinc-950 flex items-center justify-center overflow-hidden flex-shrink-0">
          <div className="w-full max-w-[1400px] aspect-[21/9] md:aspect-[2.35/1] max-h-[55vh] relative shadow-[0_0_100px_rgba(0,0,0,0.95)]">
            {imageLoading && (
              <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/98 backdrop-blur-md">
                <Sun className="w-10 h-10 text-yellow-600 animate-spin-slow mb-4" />
                <p className="text-[10px] text-yellow-600 font-black uppercase tracking-[0.8em] animate-pulse">Synthesizing Eidos...</p>
              </div>
            )}
            {currentImage ? (
              <img src={currentImage} className={`w-full h-full object-contain transition-opacity duration-1000 ${gameState.weirdnessSignature > 80 ? 'hue-rotate-30 saturate-150' : ''}`} />
            ) : (
              <div className="w-full h-full flex items-center justify-center border-x border-zinc-900 bg-zinc-900/10">
                 <Clapperboard className="w-24 h-24 text-zinc-900 opacity-20" />
              </div>
            )}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]" />
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 md:px-12 space-y-6 scroll-smooth relative bg-[radial-gradient(circle_at_50%_40%,rgba(10,10,10,1)_0%,rgba(0,0,0,1)_100%)]">
          <div className="max-w-4xl mx-auto space-y-8 pb-4">
            {history.map((entry, i) => (
              <div key={i} className={`flex flex-col ${entry.role === 'user' ? 'items-end' : 'items-start'} animate-in slide-in-from-bottom-8 fade-in duration-700`}>
                <div className={`
                  relative px-6 py-4 text-[14px] leading-[1.6] transition-all 
                  ${entry.role === 'user' 
                    ? 'bg-zinc-900/10 border-r-4 border-zinc-800 text-zinc-500 italic max-w-[75%] rounded-l-2xl' 
                    : 'bg-black/60 text-zinc-100 max-w-[98%] font-cinzel tracking-wider shadow-[15px_15px_40px_rgba(0,0,0,0.9)] border-l-2 border-yellow-900/30 rounded-r-2xl backdrop-blur-sm'
                  }
                `}>
                  {entry.role === 'ai' && <div className="absolute -top-4 -left-4 opacity-10 pointer-events-none"><Quote className="w-10 h-10 text-cyan-500" /></div>}
                  {entry.role === 'ai' ? formatNarration(entry.text) : entry.text}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-2 md:p-4 bg-[#080808] border-t border-zinc-900 relative z-30 shadow-[0_-30px_60px_rgba(0,0,0,1)] flex-shrink-0">
          <div className="max-w-5xl mx-auto space-y-3">
            {hintText && (
               <div className="px-6 py-2 bg-yellow-900/10 border border-yellow-900/30 rounded-full text-center animate-in fade-in slide-in-from-bottom-2">
                 <p className="text-[10px] font-black text-yellow-500 uppercase italic tracking-widest">{hintText}</p>
               </div>
            )}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {currentChoices.map((choice, i) => (
                <button key={i} onClick={() => handleAction(choice)} className="px-3 py-1.5 text-[8px] bg-black/90 text-cyan-400 border border-cyan-900/60 hover:border-cyan-400 hover:text-white transition-all uppercase font-black tracking-widest rounded-lg backdrop-blur-sm group"><span className="group-hover:translate-x-1 transition-transform inline-block">{choice}</span></button>
              ))}
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); if(inputValue) handleAction(inputValue); }} className="flex gap-2">
              <input 
                type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder={currentEnemy ? "CONSTRUCT COUNTER-DEFINITION..." : "FOLLOW THE REALITY THREAD..."}
                className="w-full border-2 bg-zinc-950/20 rounded-xl px-5 py-3 text-xs font-black outline-none border-zinc-900 text-yellow-500"
              />
              <button type="button" onClick={fetchHint} disabled={hintLoading} className="px-5 rounded-xl border border-zinc-800 bg-zinc-900 text-zinc-500 hover:text-yellow-500 hover:border-yellow-500 transition-all">
                {hintLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <HelpCircle className="w-5 h-5" />}
              </button>
              <button type="button" onClick={toggleVoiceMode} className={`px-5 rounded-xl border transition-all ${isVoiceActive ? 'bg-yellow-500 text-white' : 'bg-zinc-900 text-zinc-500'}`}>
                {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </button>
              <button type="submit" disabled={loading} className="px-6 rounded-xl border border-yellow-900 bg-yellow-900/10 text-yellow-500 disabled:opacity-50">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
              </button>
            </form>
          </div>
        </div>

        {showLog && (
          <div className="absolute inset-0 bg-black/99 z-[250] flex items-center justify-center p-8 backdrop-blur-3xl animate-in zoom-in duration-500">
             <div className="max-w-2xl w-full border-4 border-yellow-900/40 bg-zinc-950 p-12 text-center rounded-[3rem] shadow-2xl relative">
                  <h3 className="text-4xl font-cinzel font-black uppercase italic tracking-tighter text-yellow-500 mb-8">Architect's Log</h3>
                  <textarea 
                    value={logContent}
                    onChange={(e) => setLogContent(e.target.value)}
                    placeholder="Contribute new lore or thread-conspiracies. The weave will adapt..."
                    className="w-full h-64 bg-black/60 border-2 border-yellow-900/30 rounded-2xl p-6 text-yellow-500 font-bold uppercase tracking-widest outline-none focus:border-yellow-500 transition-all mb-8 placeholder:opacity-30"
                  />
                  <div className="flex gap-4">
                    <button onClick={() => setShowLog(false)} className="flex-1 py-4 font-black uppercase text-[12px] tracking-[0.4em] rounded-full border border-zinc-800 text-zinc-500 hover:text-white hover:border-white transition-all">Discard</button>
                    <button onClick={() => { handleAction(`[ARCHITECT_LOG]: ${logContent}`); setShowLog(false); setLogContent(""); }} className="flex-1 py-4 font-black uppercase text-[12px] tracking-[0.4em] rounded-full bg-yellow-500 text-black hover:bg-white transition-all">Submit Lore</button>
                  </div>
             </div>
          </div>
        )}

        {showCanon && (
          <div className="absolute inset-0 bg-black/99 z-[200] flex items-center justify-center p-8 backdrop-blur-3xl animate-in fade-in duration-700">
            <div className="max-w-2xl w-full bg-[#030303] border-2 border-zinc-800 rounded-[2.5rem] flex flex-col overflow-hidden max-h-[85vh] shadow-[0_0_80px_rgba(0,0,0,1)]">
               <div className="p-8 border-b border-zinc-900 flex justify-between items-center bg-black">
                 <h3 className="text-4xl font-cinzel font-bold text-white tracking-widest uppercase italic">Director's Canon</h3>
                 <button onClick={() => setShowCanon(false)} className="p-3 hover:bg-zinc-900 text-zinc-600 hover:text-red-500 transition-all rounded-full"><X className="w-8 h-8" /></button>
               </div>
               <div className="p-10 space-y-8 overflow-y-auto">
                 {fullCanon.map((book, i) => (
                   <div key={i} className={`p-8 rounded-[2rem] border-2 transition-all bg-white/5 border-white/10 hover:border-white shadow-2xl group ${book.isUserGenerated ? 'border-yellow-900/40 bg-yellow-900/10' : ''}`}>
                     <div className="flex justify-between items-start mb-2">
                       <h4 className={`text-2xl font-black uppercase italic tracking-tighter ${book.isUserGenerated ? 'text-yellow-500' : 'text-white'}`}>{book.title}</h4>
                     </div>
                     <p className="text-[13px] text-zinc-400 italic font-inter mt-4 leading-relaxed font-black tracking-tight">{book.desc}</p>
                     {book.weakEnding && (
                        <div className="mt-6 pt-4 border-t border-zinc-800 flex items-start gap-4">
                           <div className="flex-shrink-0 mt-1"><AlertCircle className="w-4 h-4 text-magenta-500" /></div>
                           <div className="bg-magenta-900/10 border border-dashed border-magenta-900/40 px-4 py-2 rounded-xl">
                              <p className="text-[9px] font-black text-magenta-500 uppercase tracking-[0.2em] mb-1">Director's Note: Weak Ending Clue</p>
                              <p className="text-sm font-mono font-bold text-white italic tracking-tighter uppercase">{book.weakEnding}</p>
                           </div>
                        </div>
                     )}
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}

        {showBible && (
          <div className="absolute inset-0 bg-black/98 z-[150] flex items-center justify-center p-8 backdrop-blur-2xl animate-in slide-in-from-right duration-700">
            <div className="max-w-3xl w-full h-[85vh] bg-[#020202] border-2 border-yellow-900/20 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
              <div className="p-10 border-b border-yellow-900/10 flex justify-between items-center bg-black">
                <h3 className="text-4xl font-cinzel font-bold text-white tracking-widest uppercase">The World Bible</h3>
                <button onClick={() => setShowBible(false)} className="p-3 text-zinc-700 hover:text-yellow-500 transition-all"><X className="w-8 h-8" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-8">
                {INITIAL_LORE.map((lore, i) => (
                  <div key={i} className="p-8 rounded-[2rem] border border-zinc-900 hover:border-yellow-900/30 transition-all bg-black/60 group">
                    <h4 className="text-2xl font-cinzel font-bold text-yellow-600 uppercase tracking-widest pb-4 border-b border-yellow-900/5 group-hover:text-white transition-colors">{lore.term}</h4>
                    <p className="text-sm font-mono italic text-zinc-500 mt-6 leading-relaxed font-black tracking-tight">{lore.def}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const StatBar: React.FC<{ label: string, value: number, max: number, color: string }> = ({ label, value, max, color }) => (
  <div className="space-y-2.5">
    <div className="flex justify-between text-[11px] text-zinc-600 font-black uppercase tracking-[0.4em]"><span>{label}</span><span className="opacity-30">{value}/{max}</span></div>
    <div className="h-2 bg-zinc-900 rounded-full overflow-hidden border border-white/5 shadow-inner"><div className={`h-full ${color} transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(255,255,255,0.15)]`} style={{ width: `${Math.min(100, (value/max)*100)}%` }} /></div>
  </div>
);

const IdentityCard: React.FC<{ name: string, icon: React.ReactNode, desc: string, onClick: () => void }> = ({ name, icon, desc, onClick }) => (
  <button onClick={onClick} className="bg-zinc-950/80 border-2 border-zinc-900 p-12 rounded-[3.5rem] hover:border-yellow-500 transition-all hover:bg-yellow-900/10 text-left group shadow-2xl relative overflow-hidden backdrop-blur-sm">
    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    <div className="text-zinc-800 mb-10 group-hover:text-yellow-500 transition-colors transform group-hover:-translate-y-3 group-hover:scale-110 duration-500">{icon}</div>
    <h3 className="text-5xl font-black text-white mb-6 uppercase italic tracking-tighter group-hover:text-yellow-400 transition-colors leading-none">{name}</h3>
    <p className="text-[13px] text-zinc-600 leading-relaxed uppercase tracking-widest font-black opacity-70 group-hover:opacity-100 duration-500">{desc}</p>
  </button>
);

export default App;
