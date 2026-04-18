import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Send, 
  Users, 
  Layout, 
  Settings, 
  LogOut, 
  Globe, 
  Cpu,
  Monitor,
  Box,
  Layers,
  Search
} from 'lucide-react';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { auth, db } from './lib/firebase';
import { Scene } from './components/Scene';
import { generateSceneFromPrompt, SceneObject } from './services/aiService';
import { v4 as uuidv4 } from 'uuid';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentWorldId, setCurrentWorldId] = useState<string | null>(null);
  const [worlds, setWorlds] = useState<any[]>([]);
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [activeTab, setActiveTab] = useState<'create' | 'worlds' | 'marketplace'>('create');

  // Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // Sync Worlds
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'worlds'), where('ownerId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const w = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setWorlds(w);
    });
    return unsubscribe;
  }, [user]);

  // Sync Objects for Current World
  useEffect(() => {
    if (!currentWorldId) {
      setObjects([]);
      return;
    }
    const q = collection(db, 'worlds', currentWorldId, 'objects');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const objs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as SceneObject[];
      setObjects(objs);
    });
    return unsubscribe;
  }, [currentWorldId]);

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const createWorld = async () => {
    if (!user) return;
    const docRef = await addDoc(collection(db, 'worlds'), {
      name: "New Aetheria World",
      ownerId: user.uid,
      isPublic: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    setCurrentWorldId(docRef.id);
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !user || !currentWorldId) return;
    setGenerating(true);
    try {
      const sceneGraph = await generateSceneFromPrompt(prompt);
      
      const objectsRef = collection(db, 'worlds', currentWorldId, 'objects');
      for (const obj of sceneGraph.objects) {
        await addDoc(objectsRef, {
          ...obj,
          createdBy: user.uid,
          updatedAt: serverTimestamp()
        });
      }
      
      setPrompt("");
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-bg text-text-main">Initialising Neural Core...</div>;

  if (!user) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-bg text-text-main overflow-hidden relative">
        <div className="absolute inset-0 opacity-10 bg-[url('https://picsum.photos/seed/nebula/1920/1080?blur=10')] bg-cover" />
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="z-10 text-center space-y-8"
        >
          <div className="space-y-2">
            <h1 className="text-7xl font-bold tracking-tight sm:text-8xl flex items-center justify-center gap-4">
               <div className="w-16 h-16 bg-accent rounded-xl"></div>
               AETHERIA
            </h1>
            <p className="text-text-muted font-medium text-sm text-center">AI-Powered Virtual Reality World Engine</p>
          </div>
          <button 
            onClick={handleLogin}
            className="group relative inline-flex items-center gap-3 px-8 py-4 bg-text-main text-white font-semibold rounded-xl hover:bg-black transition-all active:scale-95 shadow-theme"
          >
            Connect Neural Interface
            <Cpu className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-bg text-text-main font-sans selection:bg-accent selection:text-white overflow-hidden">
      {/* Header */}
      <header className="h-[56px] min-h-[56px] bg-surface border-b border-border flex items-center justify-between px-5 z-20">
        <div className="font-bold text-lg tracking-tight flex items-center gap-2">
          <div className="w-5 h-5 bg-accent rounded" />
          Aetheria Engine
        </div>
        <nav className="flex gap-6 text-[13px] font-medium items-center">
             <TabButton active={activeTab === 'create'} onClick={() => setActiveTab('create')} label="Build" />
             <TabButton active={activeTab === 'worlds'} onClick={() => setActiveTab('worlds')} label="Worlds" />
             <TabButton active={activeTab === 'marketplace'} onClick={() => setActiveTab('marketplace')} label="Marketplace" />
        </nav>
        <div className="flex items-center">
           <div className="flex items-center gap-2">
             <span className="text-[13px] font-medium text-text-muted">{user.displayName || 'Architect'}</span>
             <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-6 h-6 rounded-full border-2 border-surface bg-bg" referrerPolicy="no-referrer" />
           </div>
           <button onClick={() => signOut(auth)} className="ml-4 text-text-muted hover:text-text-main transition-colors">
             <LogOut size={16} />
           </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Sidebar */}
        <aside className="w-60 bg-surface border-r border-border flex flex-col z-10 shrink-0">
          <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            <AnimatePresence mode="wait">
              {activeTab === 'create' && (
                <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {!currentWorldId ? (
                    <div className="space-y-4 text-center mt-4">
                      <div className="w-12 h-12 rounded-xl bg-bg flex items-center justify-center mx-auto text-text-muted">
                        <Plus size={24} />
                      </div>
                      <p className="text-[13px] text-text-muted">No active session.</p>
                      <button 
                        onClick={createWorld}
                        className="w-full py-2 bg-text-main text-white font-semibold text-[13px] rounded bg-opacity-90 hover:bg-opacity-100 transition-colors"
                      >
                        New World
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-4">
                         <div className="text-[11px] text-text-muted uppercase tracking-wider font-semibold mb-3">Scene Hierarchy</div>
                         <div className="space-y-1">
                           {objects.map((obj, i) => (
                             <div key={obj.id} className="text-[13px] px-2 py-1.5 rounded-md flex items-center gap-2 hover:bg-bg cursor-pointer group transition-colors text-text-main">
                               <span className="text-accent">▣</span>
                               <span className="truncate">{obj.type} #{i+1}</span>
                             </div>
                           ))}
                           {objects.length === 0 && (
                             <p className="text-[12px] text-text-muted italic">Empty scene</p>
                           )}
                         </div>
                      </div>
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'worlds' && (
                <motion.div key="worlds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[11px] text-text-muted font-semibold uppercase tracking-wider">Archive</h3>
                    <button onClick={createWorld} className="p-1 text-text-muted hover:text-text-main transition-colors"><Plus size={14} /></button>
                  </div>
                  <div className="space-y-2">
                    {worlds.map(w => (
                      <button 
                        key={w.id}
                        onClick={() => setCurrentWorldId(w.id)}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-[13px] ${currentWorldId === w.id ? 'bg-accent/10 border-accent text-accent' : 'bg-surface border-border text-text-main hover:bg-bg'}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold">{w.name}</span>
                          <Monitor size={14} opacity={currentWorldId === w.id ? 1 : 0.4} />
                        </div>
                        <p className="text-[11px] mt-1 text-text-muted">Created: {new Date(w.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === 'marketplace' && (
                <motion.div key="marketplace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                   <p className="text-[13px] text-text-muted text-center mt-4">Marketplace coming soon.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </aside>

        {/* Viewport */}
        <main className="flex-1 relative flex items-center justify-center bg-bg overflow-hidden">
          {currentWorldId ? (
            <>
              <div className="absolute inset-0">
                <Scene objects={objects} />
              </div>

              {/* Top Right Overlay Info */}
              <div className="absolute top-4 right-4 flex items-center gap-3 bg-surface/80 backdrop-blur border border-border px-3 py-1.5 rounded-full shadow-sm z-10">
                 <div className="flex items-center gap-1.5 text-[11px] font-semibold text-text-muted uppercase tracking-wider">
                    <span className="flex items-center gap-1"><Users size={12} className="text-accent" /> 1 Online</span>
                    <span className="w-1 h-1 bg-border rounded-full mx-1" />
                    <span className="flex items-center gap-1"><Cpu size={12} /> Syncing</span>
                 </div>
              </div>

              {/* AI Prompt Container aligned to bottom-center */}
              {activeTab === 'create' && (
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[520px] bg-surface/80 backdrop-blur-xl p-3 border border-border shadow-theme rounded-2xl flex flex-col gap-2 z-10 transition-all">
                  <input 
                    type="text"
                    className="w-full bg-transparent border-none text-[15px] outline-none p-2 text-text-main placeholder-text-muted"
                    placeholder="Ask Gemini to generate a cyberpunk city plaza with rain..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && prompt.trim() && !generating) {
                        handleGenerate();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-2">
                    <div className="text-[11px] text-accent font-semibold flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full bg-accent ${generating ? 'animate-pulse' : ''}`} />
                      Gemini 3.1 Pro Active
                    </div>
                    <button 
                      onClick={handleGenerate}
                      disabled={generating || !prompt.trim()}
                      className="bg-text-main text-white border-none py-1.5 px-4 rounded-lg text-[12px] font-semibold cursor-pointer disabled:opacity-50 transition-colors hover:bg-black"
                    >
                      {generating ? 'Generating...' : 'Generate'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center text-center z-10">
               <div className="w-16 h-16 rounded-full border-2 border-dashed border-border mb-4 flex items-center justify-center">
                 <Globe className="text-text-muted" size={24} />
               </div>
               <h2 className="text-[15px] font-semibold text-text-main">No World Selected</h2>
               <p className="text-[13px] text-text-muted mt-1 max-w-xs">Create a new simulation or select one from the archive to begin.</p>
            </div>
          )}
        </main>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: var(--color-text-muted); }
      `}</style>
    </div>
  );
}

const TabButton = ({ active, onClick, label }: { active: boolean, onClick: () => void, label: string }) => (
  <span 
    onClick={onClick}
    className={`cursor-pointer transition-colors ${active ? 'text-text-main drop-shadow-sm' : 'text-text-muted hover:text-text-main'}`}
  >
    {label}
  </span>
);
