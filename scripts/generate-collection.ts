import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const DINO_NAMES = [
    "Tyrannosaurus Rex", "Triceratops", "Stegosaurus", "Brachiosaurus", "Velociraptor",
    "Ankylosaurus", "Spinosaurus", "Pteranodon", "Parasaurolophus", "Allosaurus",
    "Apatosaurus", "Iguanodon", "Carnotaurus", "Dilophosaurus", "Compsognathus",
    "Gallimimus", "Mosasaurus", "Pachycephalosaurus", "Baryonyx", "Deinonychus",
    "Diplodocus", "Giganotosaurus", "Plateosaurus", "Archaeopteryx", "Kentrosaurus",
    "Ouranosaurus", "Maiasaura", "Oviraptor", "Styracosaurus", "Torosaurus",
    "Suchomimus", "Acrocanthosaurus", "Carcharodontosaurus", "Metriacanthosaurus", "Albertosaurus",
    "Tarbosaurus", "Saltasaurus", "Shunosaurus", "Amargasaurus", "Pachyrhinosaurus",
    "Chasmosaurus", "Saichania", "Edmontosaurus", "Gastonia", "Minmi",
    "Lambeosaurus", "Shantungosaurus", "Wuerhosaurus", "Megalosaurus", "Ceratosaurus",
    "Coelophysis", "Cryolophosaurus", "Daspletosaurus", "Dreadnoughtus", "Einiosaurus",
    "Euoplocephalus", "Gorgosaurus", "Hadrosaurus", "Herrerasaurus", "Irritator",
    "Kulindadromeus", "Majungasaurus", "Mamenchisaurus", "Microraptor", "Nodosaurus",
    "Ornithomimus", "Pentaceratops", "Protoceratops", "Rajasaurus", "Saurolophus",
    "Sinoceratops", "Therizinosaurus", "Titanosaurus", "Troodon", "Utahraptor",
    "Zuniceratops", "Dicraeosaurus", "Eoraptor", "Futabasaurus", "Gondwanatitan",
    "Guanlong", "Hypsilophodon", "Lexovisaurus", "Linhenykus", "Monoclonius",
    "Nemegtosaurus", "Opisthocoelicaudia", "Ornitholestes", "Patagosaurus", "Polacanthus",
    "Psittacosaurus", "Pyroraptor", "Qianzhousaurus", "Scansoriopteryx", "Sinosauropteryx",
    "Suzhousaurus", "Yangchuanosaurus", "Yutyrannus", "Abelisaurus", "Sauroposeidon"
];

const ENERGY_TYPES = ['Fighting', 'Water', 'Lightning', 'Grass', 'Psychic', 'Fire'];

const ENERGY_COLORS: Record<string, string> = {
    'Fighting': 'Orange',
    'Water': 'Blue',
    'Lightning': 'Yellow',
    'Grass': 'Green',
    'Psychic': 'Pink',
    'Fire': 'Red'
};

async function generateDinoStats(dinoName: string, energyType: string): Promise<any> {
    console.log(`[STATS] Generating for ${dinoName}...`);
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: `Generate detailed baseball-card style stats for the dinosaur: ${dinoName} with Energy Type: ${energyType}. 
            Include scientific name, period, diet, height (meters), weight (kg), location, a fun fact, a rarity level.
            Provide an informative 100-word description.
            Include battle stats: level (1-100), hp (40-200), and 2 attacks.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        scientificName: { type: Type.STRING },
                        period: { type: Type.STRING },
                        diet: { type: Type.STRING, enum: ['Herbivore', 'Carnivore', 'Omnivore'] },
                        height: { type: Type.STRING },
                        weight: { type: Type.STRING },
                        location: { type: Type.STRING },
                        funFact: { type: Type.STRING },
                        description: { type: Type.STRING },
                        rarity: { type: Type.STRING, enum: ['Common', 'Uncommon', 'Rare', 'Legendary'] },
                        level: { type: Type.INTEGER },
                        hp: { type: Type.INTEGER },
                        energyType: { type: Type.STRING },
                        attacks: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    name: { type: Type.STRING },
                                    description: { type: Type.STRING },
                                    damage: { type: Type.INTEGER },
                                },
                                required: ['name', 'description', 'damage']
                            },
                        },
                        passiveAbility: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                            },
                            required: ['name', 'description']
                        },
                        topSpeed: { type: Type.STRING },
                        discoveryYear: { type: Type.STRING },
                    },
                    required: ['name', 'scientificName', 'period', 'diet', 'height', 'weight', 'location', 'funFact', 'description', 'rarity', 'level', 'hp', 'energyType', 'attacks', 'passiveAbility', 'topSpeed', 'discoveryYear'],
                }
            }
        });
        const text = response.text || '{}';
        return JSON.parse(text);
    } catch (e: any) {
        console.error(`Stats generation failed for ${dinoName}:`, e.message);
        return null;
    }
}

async function generateDinoImage(stats: any): Promise<string | null> {
    console.log(`[IMAGE] Generating front for ${stats.name}...`);
    try {
        const targetColor = ENERGY_COLORS[stats.energyType] || 'Yellow';

        // Pick one of the 3 reference images randomly
        const refImages = ['dino1.png', 'dino2.png', 'dino3.png'];
        const refName = refImages[Math.floor(Math.random() * refImages.length)];
        const refPath = path.join(__dirname, '..', 'src', 'assets', refName);
        const base64Data = fs.readFileSync(refPath).toString('base64');

        const prompt = `Create a new, unique FRONT SIDE dinosaur collectible trading card for "${stats.name}" that EXACTLY matches the visual style of the provided reference image.
        1. CUSTOM TYPOGRAPHY: Exact font style and placement for Name (${stats.name.toUpperCase()}), Level (Lv.${stats.level}), HP (HP ${stats.hp}).
        2. BORDER COLOR: THE BORDER AND ACCENTS MUST BE SPECIFICALLY ${targetColor}. IGNORE THE REFERENCE COLOR and use ${targetColor}.
        3. ILLUSTRATION: A hand-drawn, chibi-style illustration of a ${stats.name} in its habitat. Bold black outlines.
        4. BACKGROUND: Solid dark black background.
        5. CARD LAYOUT: Include the rectangular frame and energy symbol. This is the FRONT of a trading card.`;

        const response = await ai.models.generateContent({
            model: 'gemini-3.1-flash-image-preview',
            contents: {
                parts: [
                    { inlineData: { data: base64Data, mimeType: "image/png" } },
                    { text: prompt }
                ]
            },
            config: {
                imageConfig: { aspectRatio: "3:4", imageSize: "1K" }
            }
        });

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
    } catch (e: any) {
        console.error(`Image generation failed for ${stats.name}:`, e.message);
    }
    return null;
}

async function run() {
    const outputDir = path.join(__dirname, '..', 'public', 'collection');
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const manifestPath = path.join(outputDir, 'manifest.json');
    let manifest: any[] = [];
    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }

    console.log(`Starting generation sequence for ${DINO_NAMES.length} dinosaurs...`);

    for (const name of DINO_NAMES) {
        if (manifest.some(m => m.stats.name.toLowerCase() === name.toLowerCase())) {
            console.log(`[SKIP] ${name} already in manifest.`);
            continue;
        }

        const energyType = ENERGY_TYPES[Math.floor(Math.random() * ENERGY_TYPES.length)];
        const stats = await generateDinoStats(name, energyType);

        if (stats) {
            const imageBase64 = await generateDinoImage(stats);
            if (imageBase64) {
                const baseName = name.toLowerCase().replace(/\s+/g, '-');
                const fileName = `${baseName}-front.png`;
                fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(imageBase64, 'base64'));

                manifest.push({
                    stats,
                    imageUrl: `/collection/${fileName}`,
                    backImageUrl: `` // No back image for now as requested
                });

                fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
                console.log(`[SUCCESS] Generated ${name}`);
            }
        }

        // Small delay to be kind to the API
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    console.log("Pre-generation complete!");
}

run();
