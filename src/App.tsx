import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, RotateCw, Info, MapPin, Scale, Ruler, Utensils, Calendar, Sparkles, Key, AlertCircle, ArrowRight, X } from 'lucide-react';
import { DinoCardData, DinoStats } from './types';
import { generateDinoStats, generateDinoImage, checkApiKey, openApiKeyDialog } from './services/gemini';

// --- Components ---

const Typewriter = ({ text, speed = 20, onComplete }: { text: string; speed?: number; onComplete?: () => void }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText((prev) => prev + text[index]);
        setIndex((prev) => prev + 1);
      }, speed);
      return () => clearTimeout(timeout);
    } else if (onComplete) {
      onComplete();
    }
  }, [index, text, speed, onComplete]);

  return <span className="typing-cursor">{displayedText}</span>;
};

const ApiKeyPrompt = ({ onComplete }: { onComplete: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-black border-2 border-white rounded-2xl p-8 shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] text-center"
      >
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-6">
          <Key className="w-8 h-8 text-black" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-4 text-white">API Key Required</h2>
        <p className="text-zinc-400 mb-8 font-sans">
          To generate high-quality images with Nano Banana Pro, you need to select a paid Google Cloud project API key.
        </p>
        <button
          onClick={async () => {
            await openApiKeyDialog();
            onComplete();
          }}
          className="w-full py-3 px-6 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          Select API Key
        </button>
        <p className="mt-4 text-xs text-zinc-500">
          Learn more about <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-zinc-400">Gemini API billing</a>.
        </p>
      </motion.div>
    </div>
  );
};

const CardFront = ({ stats, imageUrl }: { stats: DinoStats; imageUrl: string }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-black border-4 border-black">
      {/* Background Image */}
      <img 
        src={imageUrl} 
        alt={stats.name} 
        className="w-full h-full object-cover"
        referrerPolicy="no-referrer"
      />
    </div>
  );
};

const CardBack = ({ stats, imageUrl }: { stats: DinoStats; imageUrl?: string }) => {
  return (
    <div className="w-full h-full relative overflow-hidden bg-black flex flex-col items-center justify-center p-8 border border-white/10">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={`${stats.name} Back`} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-start justify-between font-mono text-white p-4">
          <div className="w-full flex justify-between items-center border-b border-white/20 pb-4">
            <span className="text-xl uppercase tracking-widest">{stats.name}</span>
            <span className="text-sm opacity-60 italic">{stats.scientificName}</span>
          </div>
          
          <div className="flex-1 w-full flex flex-col justify-center gap-6 py-8">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Passive Ability</p>
              <p className="text-sm text-white uppercase">{stats.passiveAbility.name}</p>
              <p className="text-[10px] text-zinc-400 lowercase leading-tight">{stats.passiveAbility.description}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4">
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Top Speed</p>
                <p className="text-sm text-white font-bold">{stats.topSpeed}</p>
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 uppercase">Discovery</p>
                <p className="text-sm text-white font-bold">{stats.discoveryYear}</p>
              </div>
            </div>
          </div>

          <div className="w-full pt-4 border-t border-white/20 flex justify-between items-end opacity-40 grayscale">
            <div className="space-y-1">
               <p className="text-[8px]">© DINODEX REPOSITORY v1.0</p>
               <p className="text-[8px]">AUTHENTIC PREHISTORIC DATA</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatsCard = ({ label, value, sublabel }: { label: string; value: string | number; sublabel?: string }) => (
  <div className="flex flex-col gap-1 border border-white/10 p-4 bg-zinc-900/20 hover:bg-zinc-900/40 transition-colors group">
    <span className="font-mono text-[8px] text-zinc-500 uppercase tracking-widest">{label}</span>
    <span className="text-2xl md:text-3xl font-londrina font-black text-white group-hover:scale-110 transition-transform origin-left">{value}</span>
    {sublabel && <span className="font-mono text-[7px] md:text-[8px] text-zinc-600 uppercase mt-1 leading-tight">{sublabel}</span>}
  </div>
);

const getDeterministicType = (n: string) => {
  const types = ['Fighting', 'Water', 'Lightning', 'Grass', 'Psychic', 'Fire'];
  const hash = n.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return types[hash % types.length];
};

const EggCard = ({ name, dino, onSelect }: { name: string; dino?: DinoCardData; onSelect: (name: string) => void }) => {
  const energyType = dino?.stats.energyType || getDeterministicType(name);
  const eggImage = `/assets/eggs/${energyType.toLowerCase()}-egg.png`;
  
  return (
    <motion.div 
      whileHover={{ y: -5, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(name)}
      className="bg-black p-4 flex flex-col items-center gap-4 cursor-pointer group transition-all"
    >
      <div className="w-full aspect-square bg-black flex items-center justify-center p-4 relative overflow-hidden">
        <motion.img 
          initial={{ scale: 0.9 }}
          animate={{ 
            scale: [0.9, 1, 0.9],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          src={eggImage} 
          alt={`${energyType} Egg`}
          className="w-full h-full object-contain transition-all z-10"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
          }}
        />
      </div>
      <div className="text-center w-full px-2 overflow-hidden">
        <h3 className="font-londrina text-xl text-white uppercase tracking-widest truncate">{name}</h3>
        <p className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mt-1 font-bold">{energyType}</p>
        <p className="font-mono text-[8px] text-zinc-600 uppercase tracking-widest mt-0.5">Dormant Specimen</p>
      </div>
    </motion.div>
  );
};

const AdminCard: React.FC<{ name: string; dino?: DinoCardData; onSuccess: (updated: DinoCardData) => void }> = ({ name, dino, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [currentImg, setCurrentImg] = useState(dino?.imageUrl || '');

  useEffect(() => {
    if (dino?.imageUrl) {
      setCurrentImg(dino.imageUrl);
    }
  }, [dino?.imageUrl]);

  const handleRegenerate = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const refImages = ['dino1.png', 'dino2.png', 'dino3.png'];
      const commonRef = refImages[Math.floor(Math.random() * refImages.length)];
      
      let stats = dino?.stats;
      if (!stats) {
        const energyTypes = ['Fighting', 'Water', 'Lightning', 'Grass', 'Psychic', 'Fire'];
        const energyType = energyTypes[Math.floor(Math.random() * energyTypes.length)];
        stats = await generateDinoStats(name, energyType);
      }

      if (stats) {
        const imageResult = await generateDinoImage(stats, 'front', commonRef);
        const imageBase64 = imageResult.includes('base64,') 
          ? imageResult.split('base64,')[1] 
          : imageResult;

        if (imageBase64) {
          const resp = await fetch('/api/save-card', {
            method: 'POST',
            body: JSON.stringify({ name, imageBase64, stats })
          });
          
          if (resp.ok) {
            const updated = {
               stats,
               imageUrl: `/collection/${name.toLowerCase().replace(/\s+/g, '-')}-front.png`,
               backImageUrl: ""
            };
            setCurrentImg(updated.imageUrl + "?t=" + Date.now());
            onSuccess(updated);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-900/30 border border-white/5 p-4 flex flex-col gap-4 group hover:border-white/20 transition-all hover:bg-zinc-900/50">
      <div className="aspect-[3/4] w-full bg-black border border-white/5 overflow-hidden relative shadow-2xl">
         {currentImg ? (
           <img 
             src={currentImg} 
             className="w-full h-full object-cover transition-all duration-700" 
           />
         ) : (
           <div className="w-full h-full flex flex-col items-center justify-center gap-2">
             <RotateCw className="w-6 h-6 text-zinc-800 animate-spin" />
             <span className="text-[10px] text-zinc-800 font-mono">NO DATA</span>
           </div>
         )}
         <div className="absolute top-2 right-2">
            {dino ? (
              <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
            ) : (
              <div className="w-2 h-2 bg-zinc-700 rounded-full" />
            )}
         </div>
      </div>
      
      <div className="flex flex-col gap-1 min-h-[48px]">
        <span className="text-white font-bold tracking-tight text-sm uppercase truncate leading-none">{name}</span>
        <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-widest truncate">
          {dino?.stats.energyType || 'Unassigned'}
        </span>
      </div>

      <button 
        onClick={handleRegenerate}
        disabled={loading}
        className="w-full h-10 bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-20 flex items-center justify-center gap-2"
      >
        {loading ? <RotateCw className="w-3 h-3 animate-spin" /> : <RotateCw className="w-3 h-3" />}
        {loading ? 'WAIT...' : 'REGEN'}
      </button>
    </div>
  );
};

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

const DINO_TREE: TreeNode = {
  name: "Dinosauria",
  children: [
    {
      name: "Saurischia (Lizard-Hipped)",
      children: [
        {
          name: "Theropods (Predatory)",
          children: [
            { name: "Tyrannosaurus Rex" }, { name: "Velociraptor" }, { name: "Spinosaurus" }, { name: "Allosaurus" },
            { name: "Carnotaurus" }, { name: "Dilophosaurus" }, { name: "Compsognathus" }, { name: "Gallimimus" },
            { name: "Baryonyx" }, { name: "Deinonychus" }, { name: "Giganotosaurus" }, { name: "Archaeopteryx" },
            { name: "Acrocanthosaurus" }, { name: "Carcharodontosaurus" }, { name: "Metriacanthosaurus" }, { name: "Albertosaurus" },
            { name: "Tarbosaurus" }, { name: "Megalosaurus" }, { name: "Ceratosaurus" }, { name: "Coelophysis" },
            { name: "Cryolophosaurus" }, { name: "Daspletosaurus" }, { name: "Gorgosaurus" }, { name: "Herrerasaurus" },
            { name: "Irritator" }, { name: "Majungasaurus" }, { name: "Microraptor" }, { name: "Ornithomimus" },
            { name: "Rajasaurus" }, { name: "Troodon" }, { name: "Utahraptor" }, { name: "Guanlong" },
            { name: "Ornitholestes" }, { name: "Pyroraptor" }, { name: "Qianzhousaurus" }, { name: "Sinosauropteryx" },
            { name: "Yangchuanosaurus" }, { name: "Yutyrannus" }, { name: "Abelisaurus" }
          ],
        },
        {
          name: "Sauropods (Long-Necked)",
          children: [
            { name: "Brachiosaurus" }, { name: "Apatosaurus" }, { name: "Diplodocus" }, { name: "Plateosaurus" },
            { name: "Saltasaurus" }, { name: "Shunosaurus" }, { name: "Amargasaurus" }, { name: "Shantungosaurus" },
            { name: "Dreadnoughtus" }, { name: "Mamenchisaurus" }, { name: "Titanosaurus" }, { name: "Dicraeosaurus" },
            { name: "Gondwanatitan" }, { name: "Nemegtosaurus" }, { name: "Opisthocoelicaudia" }, { name: "Patagosaurus" },
            { name: "Sauroposeidon" }
          ],
        },
      ],
    },
    {
      name: "Ornithischia (Bird-Hipped)",
      children: [
        {
          name: "Thyreophora (Armored)",
          children: [
            { name: "Stegosaurus" }, { name: "Ankylosaurus" }, { name: "Kentrosaurus" }, { name: "Saichania" },
            { name: "Gastonia" }, { name: "Minmi" }, { name: "Wuerhosaurus" }, { name: "Euoplocephalus" },
            { name: "Lexovisaurus" }, { name: "Polacanthus" }, { name: "Nodosaurus" }
          ],
        },
        {
          name: "Marginocephalia (Horns/Domes)",
          children: [
            { name: "Triceratops" }, { name: "Pachycephalosaurus" }, { name: "Styracosaurus" }, { name: "Torosaurus" },
            { name: "Pachyrhinosaurus" }, { name: "Chasmosaurus" }, { name: "Pentaceratops" }, { name: "Protoceratops" },
            { name: "Sinoceratops" }, { name: "Zuniceratops" }, { name: "Monoclonius" }, { name: "Psittacosaurus" }
          ],
        },
        {
          name: "Ornithopoda (Bipedal Herbivores)",
          children: [
            { name: "Parasaurolophus" }, { name: "Iguanodon" }, { name: "Ouranosaurus" }, { name: "Maiasaura" },
            { name: "Oviraptor" }, { name: "Edmontosaurus" }, { name: "Lambeosaurus" }, { name: "Hadrosaurus" },
            { name: "Kulindadromeus" }, { name: "Saurolophus" }, { name: "Hypsilophodon" }, { name: "Linhenykus" },
            { name: "Scansoriopteryx" }, { name: "Suzhousaurus" }
          ],
        },
      ],
    },
    {
      name: "Prehistoric Peers",
      children: [
        { name: "Mosasaurus" },
        { name: "Pteranodon" },
        { name: "Futabasaurus" }
      ]
    }
  ],
};

const flattenTree = (node: TreeNode): string[] => {
  let names = [node.name];
  if (node.children) {
    node.children.forEach(child => {
      names = [...names, ...flattenTree(child)];
    });
  }
  return names;
};

const ALL_DINO_NAMES = flattenTree(DINO_TREE);

const TreeItem = ({ 
  node, 
  onSelect, 
  selectedIndex, 
  allNames, 
  isRoot = false,
  collectedDinos = [],
  isKeyboardNavigating = false
}: { 
  node: TreeNode; 
  onSelect: (name: string) => void; 
  selectedIndex: number;
  allNames: string[];
  isRoot?: boolean;
  collectedDinos?: DinoCardData[];
  isKeyboardNavigating?: boolean;
}) => {
  const itemRef = useRef<HTMLDivElement>(null);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = allNames[selectedIndex] === node.name;
  const isCollected = collectedDinos.some(d => d.stats.name.toLowerCase() === node.name.toLowerCase());
  const isLeaf = !node.children || node.children.length === 0;

  useEffect(() => {
    if (isSelected && itemRef.current && isKeyboardNavigating) {
      itemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [isSelected, isKeyboardNavigating]);

  return (
    <div ref={itemRef} className="relative flex flex-col">
      <div className="flex items-center">
        {!isRoot && (
          <div className="w-6 h-[1px] bg-white/20 mr-0 shrink-0" />
        )}
        <button
          onClick={() => onSelect(node.name)}
          className={`font-mono text-xl md:text-2xl py-2 px-4 rounded transition-all text-left uppercase tracking-[0.2em] break-words whitespace-normal w-full md:max-w-[480px] ${
            isSelected 
              ? 'text-white bg-white/20' 
              : (isLeaf && isCollected ? 'text-white' : 'text-white/40 hover:text-white hover:bg-white/10')
          }`}
        >
          <span className="block">
            {node.name}
            {isLeaf && isCollected && (
              <span className="ml-3 inline-block w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
            )}
          </span>
        </button>
      </div>

      {hasChildren && (
        <div className="ml-[20px] border-l border-white/20 flex flex-col relative mt-1">
          {node.children!.map((child, i) => {
            const isLast = i === node.children!.length - 1;
            return (
              <div key={child.name} className="relative">
                {/* Horizontal connector for the child */}
                <div className="absolute top-[24px] -left-px w-4 h-[1px] bg-white/20" />
                
                {/* If it's the last child, we hide the rest of the parent's vertical border below the connector */}
                {isLast && (
                  <div className="absolute top-[24px] -left-[2px] w-[3px] bottom-0 bg-black z-10" />
                )}
                
                <div className="pl-4">
                  <TreeItem 
                    node={child} 
                    onSelect={onSelect} 
                    selectedIndex={selectedIndex}
                    allNames={allNames}
                    collectedDinos={collectedDinos}
                    isKeyboardNavigating={isKeyboardNavigating}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};



const DinoTree = ({ 
  onSelect, 
  selectedIndex, 
  allNames,
  collectedDinos,
  isKeyboardNavigating
}: { 
  onSelect: (name: string) => void; 
  selectedIndex: number;
  allNames: string[];
  collectedDinos: DinoCardData[];
  isKeyboardNavigating: boolean;
}) => {
  return (
    <div className="w-full pb-12 flex justify-start">
      <div className="w-full">
        <TreeItem 
          node={DINO_TREE} 
          onSelect={onSelect} 
          selectedIndex={selectedIndex}
          allNames={allNames}
          isRoot={true} 
          collectedDinos={collectedDinos}
          isKeyboardNavigating={isKeyboardNavigating}
        />
      </div>
    </div>
  );
};

import logo from './assets/logo.png';

export default function App() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardData, setCardData] = useState<DinoCardData | null>(null);
  const [tempStats, setTempStats] = useState<DinoStats | null>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [view, setView] = useState<'landing' | 'card' | 'gallery' | 'admin'>(() => {
    const path = window.location.pathname.replace(/\/$/, '') || '/';
    if (path === '/admin') return 'admin';
    if (path === '/collection' || path === '/gallery') return 'gallery';
    if (path === '/card') return 'card';
    return 'landing';
  });
  const [typingFinished, setTypingFinished] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [collectedDinos, setCollectedDinos] = useState<DinoCardData[]>([]);
  const [preGeneratedCollection, setPreGeneratedCollection] = useState<DinoCardData[]>([]);
  const [isKeyboardNavigating, setIsKeyboardNavigating] = useState(false);
  const [adminSearchTerm, setAdminSearchTerm] = useState('');
  const [adminTypeFilter, setAdminTypeFilter] = useState<string | null>(null);
  const [galleryTypeFilter, setGalleryTypeFilter] = useState<string | null>(null);

  // Sync state with URL
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/\/$/, '') || '/';
      if (path === '/admin') setView('admin');
      else if (path === '/collection' || path === '/gallery') setView('gallery');
      else if (path === '/card') setView('card');
      else setView('landing');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (newView: 'landing' | 'card' | 'gallery' | 'admin') => {
    setView(newView);
    const path = newView === 'landing' ? '/' : `/${newView}`;
    if (window.location.pathname !== path) {
      window.history.pushState({}, '', path);
    }
  };

  useEffect(() => {
    const loadManifest = async () => {
      try {
        const resp = await fetch('/collection/manifest.json');
        if (resp.ok) {
          const data = await resp.json();
          const mapped = data.map((item: any) => ({
            ...item,
            imageUrl: item.imageUrl || item.frontImageUrl
          }));
          setPreGeneratedCollection(mapped);
          setCollectedDinos(prev => {
            const newNames = new Set(mapped.map((d: any) => d.stats.name.toLowerCase()));
            const existingFiltered = prev.filter(d => !newNames.has(d.stats.name.toLowerCase()));
            return [...mapped, ...existingFiltered];
          });
        }
      } catch (e) {}
    };
    loadManifest();
  }, []);

  const handleSearch = useCallback(async (dinoName?: string) => {
    const searchTerm = dinoName || query;
    if (!searchTerm.trim() || loading) return;

    setCurrentDinoName(searchTerm);
    navigate('card');
    setLoading(true);
    setGeneratingImage(false);
    setError(null);
    setCardData(null);
    setTempStats(null);
    setIsFlipped(false);
    setTypingFinished(false);

    try {
      const preGen = preGeneratedCollection.find(d => 
        d.stats.name.toLowerCase() === searchTerm.toLowerCase() || 
        d.stats.scientificName.toLowerCase() === searchTerm.toLowerCase()
      );

      if (preGen) {
        const readyPreGen = {
          ...preGen,
          imageUrl: preGen.imageUrl || (preGen as any).frontImageUrl,
        };
        
        setTempStats(readyPreGen.stats);
        setCardData(readyPreGen);
        setLoading(false);
        
        if (!readyPreGen.backImageUrl) {
          (async () => {
             const refImages = ['dino1.png', 'dino2.png', 'dino3.png'];
             const commonRef = refImages[Math.floor(Math.random() * refImages.length)];
            try {
              const backImageUrl = await generateDinoImage(readyPreGen.stats, 'back', commonRef);
              const updatedCard = { ...readyPreGen, backImageUrl };
              setCardData(updatedCard);
              setCollectedDinos(prev => {
                const filtered = prev.filter(d => d.stats.name.toLowerCase() !== updatedCard.stats.name.toLowerCase());
                return [updatedCard, ...filtered];
              });
            } catch (e) {
              console.error("Failed to generate back image on-the-fly", e);
            }
          })();
        }

        if (!collectedDinos.some(d => d.stats.name.toLowerCase() === readyPreGen.stats.name.toLowerCase())) {
          setCollectedDinos(prev => [readyPreGen, ...prev]);
        }
        return;
      }

      const stats = await generateDinoStats(searchTerm);
      setTempStats(stats);
      setGeneratingImage(true);
      
      const refImages = ['dino1.png', 'dino2.png', 'dino3.png'];
      const commonRef = refImages[Math.floor(Math.random() * refImages.length)];
      
      const imageUrl = await generateDinoImage(stats, 'front', commonRef);
      const backImageUrl = ""; 
      
      const imageUrls = { stats, imageUrl, backImageUrl };
      setCardData(imageUrls);
      setCollectedDinos(prev => [imageUrls, ...prev]);
      setPreGeneratedCollection(prev => [imageUrls, ...prev]);
    } catch (err: any) {
      console.error(err);
      setError("Failed to bring this dinosaur back to life. Please try again.");
    } finally {
      setLoading(false);
      setGeneratingImage(false);
    }
  }, [query, loading, collectedDinos, preGeneratedCollection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (view !== 'landing') return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setIsKeyboardNavigating(true);
        setSelectedIndex(prev => (prev + 1) % ALL_DINO_NAMES.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setIsKeyboardNavigating(true);
        setSelectedIndex(prev => (prev - 1 + ALL_DINO_NAMES.length) % ALL_DINO_NAMES.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSearch(ALL_DINO_NAMES[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [view, selectedIndex, handleSearch]);


  const [currentDinoName, setCurrentDinoName] = useState('');

  return (
    <div className="min-h-screen bg-black selection:bg-white selection:text-black">

      <AnimatePresence mode="wait">
        {view === 'landing' ? (
          <motion.main
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative w-full min-h-screen flex flex-col items-center px-5 pt-5 pb-12 md:p-12 overflow-y-auto bg-black"
          >
            {/* Background Hand Icon Removed */}

            <div className="w-full max-w-[600px] flex flex-col items-start mt-4">
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-1 md:gap-2">
                  <h1 className="text-6xl md:text-8xl font-londrina font-black uppercase tracking-normal md:tracking-widest text-white">
                    dinodex
                  </h1>
                  <img src={logo} alt="DinoDex Logo" className="w-[90px] md:w-[130px] h-auto object-contain" />
                </div>
              </div>
              {/* Search Box */}
              <div className="w-full mb-6">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="SEARCH DINOSAURS..."
                  className="w-full h-[64px] bg-black border border-white text-white px-6 focus:outline-none placeholder:text-zinc-600 uppercase tracking-widest"
                  style={{ fontFamily: "'IBM Plex Mono', monospace" }}
                />
              </div>
              {/* Collection Chips */}
              <div className="flex gap-4 mb-6">
                <button 
                  onClick={() => navigate('gallery')}
                  className="px-4 py-2 bg-white text-black font-mono text-xs uppercase tracking-widest hover:bg-zinc-200 transition-colors"
                >
                  {collectedDinos.length} dinos collected
                </button>
                <div className="px-4 py-2 border border-white/20 text-white/40 font-mono text-xs uppercase tracking-widest cursor-default">
                  {Math.max(0, 64 - collectedDinos.length)} more to go
                </div>
              </div>

              {/* Egg Gallery Grid */}
              <div className="w-full mt-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-20">
                  {ALL_DINO_NAMES
                    .filter(name => name.toLowerCase().includes(query.toLowerCase()))
                    .map((name) => {
                      const dino = preGeneratedCollection.find(d => d.stats.name.toLowerCase() === name.toLowerCase());
                      return (
                        <EggCard 
                          key={name}
                          name={name}
                          dino={dino}
                          onSelect={handleSearch}
                        />
                      );
                  })}
                </div>
              </div>

              {/* Footer */}
              <div className="w-full mt-24 pt-8 border-t border-white/5 flex justify-between items-center opacity-20">
                <p className="font-mono text-[8px] text-white tracking-widest uppercase">System: v1.0.4-LITE</p>
                <p className="font-mono text-[8px] text-white tracking-widest uppercase">© 2026 DINODEX REPOSITORY</p>
              </div>
            </div>
          </motion.main>
        ) : view === 'gallery' ? (
          <motion.main
            key="gallery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center px-5 pt-5 pb-12 md:p-12 bg-black overflow-y-auto"
          >
            <div className="w-full max-w-[1200px] flex flex-col items-start mt-4">
              <div className="flex justify-between items-end w-full mb-12 border-b border-white/10 pb-8">
                <div className="space-y-2">
                  <h2 className="text-4xl md:text-6xl font-londrina font-black uppercase tracking-normal md:tracking-widest text-white">
                    Collection
                  </h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.4em]">Repository Access v1.0.5</p>
                </div>
                <button 
                  onClick={() => navigate('landing')}
                  className="font-mono text-xs uppercase tracking-widest text-zinc-400 hover:text-white transition-colors px-6 py-3 border border-white/5 hover:border-white/20"
                >
                  [ Disconnect ]
                </button>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mb-6">
                <StatsCard 
                  label="Specimens Logged" 
                  value={collectedDinos.length} 
                  sublabel={`${Math.round((collectedDinos.length / 100) * 100)}% of Known Species`}
                />
                <StatsCard 
                  label="Total Combat Power" 
                  value={collectedDinos.reduce((sum, d) => sum + (d.stats.hp || 0), 0)} 
                  sublabel="Aggregate HP Efficiency"
                />
                <StatsCard 
                  label="Mean Training Level" 
                  value={collectedDinos.length > 0 ? Math.round(collectedDinos.reduce((sum, d) => sum + (d.stats.level || 0), 0) / collectedDinos.length) : 0} 
                  sublabel="Average Skill Potential"
                />
                <StatsCard 
                  label="System Uptime" 
                  value="99.8%" 
                  sublabel="Data Integrity Verified"
                />
              </div>

              {/* Gallery Filters */}
              <div className="w-full mb-8 flex flex-wrap gap-3 p-6 bg-zinc-900/10 border border-white/5">
                {['Fighting', 'Water', 'Lightning', 'Grass', 'Psychic', 'Fire'].map(type => {
                   const count = collectedDinos.filter(d => d.stats.energyType === type).length;
                   return (
                    <button
                      key={type}
                      onClick={() => setGalleryTypeFilter(galleryTypeFilter === type ? null : type)}
                      className={`flex items-center gap-3 px-4 py-2 font-mono text-[10px] uppercase tracking-widest border transition-all ${
                        galleryTypeFilter === type 
                          ? 'bg-white text-black border-white' 
                          : 'bg-transparent text-zinc-500 border-white/5 hover:border-white/20'
                      }`}
                    >
                      {type}
                      <span className={`px-1.5 py-0.5 text-[8px] rounded-sm ${galleryTypeFilter === type ? 'bg-black text-white' : 'bg-white/5 text-zinc-600'}`}>
                        {count}
                      </span>
                    </button>
                   );
                })}
              </div>

              {collectedDinos.length === 0 ? (
                <div className="w-full py-40 text-center border border-dashed border-white/5 mx-auto">
                  <p className="font-mono text-zinc-800 uppercase tracking-[0.5em] text-xs px-4">Repository Initialized. No data detected.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
                  {collectedDinos
                    .filter(d => !galleryTypeFilter || d.stats.energyType === galleryTypeFilter)
                    .map((dino, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="aspect-[3/4] cursor-pointer group relative overflow-hidden bg-black"
                      onClick={() => {
                        setCardData(dino);
                        setCurrentDinoName(dino.stats.name);
                        setTypingFinished(true);
                        navigate('card');
                      }}
                    >
                      <img 
                        src={dino.imageUrl} 
                        alt={dino.stats.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-sm transform translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="font-mono text-[10px] text-white uppercase tracking-widest">{dino.stats.name}</p>
                        <p className="font-mono text-[8px] text-zinc-500 uppercase">LV.{dino.stats.level} {dino.stats.energyType}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.main>
        ) : view === 'admin' ? (
          <motion.main
            key="admin"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen w-full bg-zinc-950 px-5 py-12 md:p-12 overflow-y-auto"
          >
            <div className="max-w-[1400px] mx-auto">
              <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-8">
                <div className="space-y-2">
                  <h2 className="text-7xl font-londrina font-black uppercase tracking-tight text-white italic">
                    Repository Admin
                  </h2>
                  <p className="font-mono text-[10px] text-zinc-500 uppercase tracking-[0.4em]">System Control v1.0.5</p>
                </div>
                <div className="flex flex-col items-end gap-4">
                  <button 
                    onClick={() => navigate('landing')}
                    className="font-mono text-xs uppercase tracking-widest text-zinc-500 hover:text-white transition-colors border border-zinc-900 px-6 py-3 hover:border-white"
                  >
                    Return to System
                  </button>
                  <div className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest">
                    Total Records: {ALL_DINO_NAMES.length}
                  </div>
                </div>
              </div>

              {/* Admin Search & Filters */}
              <div className="w-full mb-12 space-y-6">
                <div className="relative group">
                  <input
                    type="text"
                    value={adminSearchTerm}
                    onChange={(e) => setAdminSearchTerm(e.target.value)}
                    placeholder="LOCATE SPECIMEN BY NAME..."
                    className="w-full h-16 bg-white/5 border border-white/10 text-white px-8 focus:outline-none focus:border-white transition-all font-mono text-sm tracking-widest uppercase placeholder:text-zinc-700"
                  />
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20 group-focus-within:opacity-100 transition-opacity">
                    <RotateCw className="w-4 h-4 text-white" />
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  {['Fighting', 'Water', 'Lightning', 'Grass', 'Psychic', 'Fire'].map(type => (
                    <button
                      key={type}
                      onClick={() => setAdminTypeFilter(adminTypeFilter === type ? null : type)}
                      className={`px-4 py-2 font-mono text-[10px] uppercase tracking-widest border transition-all ${
                        adminTypeFilter === type 
                          ? 'bg-white text-black border-white' 
                          : 'bg-transparent text-zinc-500 border-white/10 hover:border-white/30'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                  {adminTypeFilter && (
                    <button 
                      onClick={() => setAdminTypeFilter(null)}
                      className="px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-red-500/50 hover:text-red-500 transition-colors"
                    >
                      [ Clear Filter ]
                    </button>
                  )}
                </div>
              </div>

              {/* Grid Layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                {ALL_DINO_NAMES
                  .filter(name => {
                    const matchesName = name.toLowerCase().includes(adminSearchTerm.toLowerCase());
                    if (!adminTypeFilter) return matchesName;
                    const dino = preGeneratedCollection.find(d => d.stats.name.toLowerCase() === name.toLowerCase());
                    return matchesName && dino?.stats.energyType === adminTypeFilter;
                  })
                  .map((name) => {
                    const dino = preGeneratedCollection.find(d => d.stats.name.toLowerCase() === name.toLowerCase());
                    return (
                      <AdminCard 
                        key={name} 
                        name={name} 
                        dino={dino} 
                        onSuccess={(updated) => {
                          setPreGeneratedCollection(prev => {
                             const exists = prev.some(p => p.stats.name.toLowerCase() === name.toLowerCase());
                             if (exists) return prev.map(p => p.stats.name.toLowerCase() === name.toLowerCase() ? updated : p);
                             return [...prev, updated];
                          });
                          setCollectedDinos(prev => {
                             const exists = prev.some(p => p.stats.name.toLowerCase() === name.toLowerCase());
                             if (exists) return prev.map(p => p.stats.name.toLowerCase() === name.toLowerCase() ? updated : p);
                             return [...prev, updated];
                          });
                        }} 
                      />
                    );
                })}
              </div>

              {/* No Results */}
              {ALL_DINO_NAMES.filter(name => name.toLowerCase().includes(adminSearchTerm.toLowerCase())).length === 0 && (
                <div className="w-full py-40 border border-dashed border-white/10 flex flex-col items-center justify-center gap-4">
                  <span className="text-zinc-700 font-mono text-xs tracking-[0.5em] uppercase">No matching specimen found</span>
                  <button 
                    onClick={() => setAdminSearchTerm('')}
                    className="text-white font-mono text-[10px] uppercase border-b border-white/20 hover:border-white transition-all pb-1"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>
          </motion.main>
        ) : (
          <motion.main
            key="card-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="min-h-screen flex flex-col items-center px-5 pt-5 pb-12 md:p-12 bg-black"
          >
            <div className="w-full max-w-[600px] flex flex-col items-start mt-4">
              {/* Header - Always visible in card view */}
              <div className="flex items-center gap-4 md:gap-8 mb-6 cursor-pointer group" onClick={() => navigate('landing')}>
                <motion.img 
                  key={`header-egg-${currentDinoName}`}
                  initial={{ opacity: 0, x: -20, scale: 0.8 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  src={`/assets/eggs/${(tempStats?.energyType || getDeterministicType(currentDinoName)).toLowerCase()}-egg.png`}
                  className="w-16 h-16 md:w-24 md:h-24 object-contain"
                />
                <div className="space-y-2">
                  <h2 className="text-3xl md:text-6xl font-londrina font-black uppercase tracking-normal md:tracking-widest text-white group-hover:text-zinc-400 transition-colors">
                    {currentDinoName}
                  </h2>
                  <div className="h-1 w-12 bg-white group-hover:bg-zinc-400 transition-colors" />
                  <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-opacity">
                    Click to return
                  </p>
                </div>
              </div>

              <div className="w-full">
                <AnimatePresence mode="wait">
                  {error ? (
                    <motion.div 
                      key="error"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex flex-col items-center gap-4 text-center w-full py-12"
                    >
                      <AlertCircle className="w-12 h-12 text-red-500" />
                      <p className="text-white font-mono">{error}</p>
                      <button 
                        onClick={() => navigate('landing')}
                        className="brutalist-pill !px-4 !py-2 !text-sm mt-4"
                      >
                        Return to Tree
                      </button>
                    </motion.div>
                  ) : (!cardData || !typingFinished) ? (
                    <motion.div 
                      key="loading-stats"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.8 } }}
                      className="space-y-8 font-mono text-white"
                    >
                      {tempStats && (
                        <div className="text-lg leading-relaxed text-zinc-300">
                          <Typewriter 
                            text={tempStats.description} 
                            speed={15} 
                            onComplete={() => setTypingFinished(true)} 
                          />
                        </div>
                      )}

                      {!tempStats && (
                        <p className="text-zinc-400 italic animate-pulse">
                          Accessing fossil records...
                        </p>
                      )}
                    </motion.div>
                  ) : (
                    <motion.div 
                      key="card"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1 }}
                      className="flex flex-col items-center gap-12 w-full"
                    >
                      <div 
                        className="perspective-1000 w-full aspect-[3/4] cursor-pointer mx-auto"
                        onClick={() => setIsFlipped(!isFlipped)}
                      >
                        <motion.div 
                          className="w-full h-full relative preserve-3d"
                          animate={{ rotateY: isFlipped ? 180 : 0 }}
                          transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        >
                          <div className="absolute inset-0 backface-hidden">
                            <CardFront stats={cardData.stats} imageUrl={cardData.imageUrl} />
                          </div>
                          <div className="absolute inset-0 backface-hidden rotate-y-180">
                            <CardBack stats={cardData.stats} imageUrl={cardData.backImageUrl} />
                          </div>
                        </motion.div>
                      </div>

                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-white text-xs font-bold uppercase tracking-widest font-mono"
                      >
                        click card to flip
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
