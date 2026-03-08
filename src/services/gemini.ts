import { GoogleGenAI, Type } from "@google/genai";
import { DinoStats, DinoCardData } from "../types";

export const getPreGeneratedDino = async (dinoName: string): Promise<DinoCardData | null> => {
  try {
    const response = await fetch('/collection/manifest.json');
    const manifest = await response.json();
    const found = manifest.find((d: any) => d.stats.name.toLowerCase() === dinoName.toLowerCase() || d.stats.scientificName.toLowerCase() === dinoName.toLowerCase());
    if (found) {
      return {
        stats: found.stats,
        imageUrl: found.frontImageUrl,
        backImageUrl: found.backImageUrl
      };
    }
    return null;
  } catch (e) {
    return null;
  }
};

export const checkApiKey = async (): Promise<boolean> => {
  return true; // Always return true, no need to ask
};

export const openApiKeyDialog = async () => {
  // No-op, we have the key pre-configured
};

export const generateDinoStats = async (dinoName: string, energyType?: string): Promise<DinoStats> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-lite-preview",
    contents: `Generate detailed baseball-card style stats for the dinosaur: ${dinoName}${energyType ? ` with Energy Type: ${energyType}` : ''}. 
    Include scientific name, period, diet, height (meters), weight (kg), location, a fun fact, a rarity level (Common, Uncommon, Rare, Legendary).
    For the description, provide an informative and conversational explanation (around 10 lines of text, approximately 100-120 words) as if you are talking to a regular person. Describe what the dinosaur looked like, what its daily life was like, and paint a clear picture of the environment it lived in (the scenery, plants, and climate). Avoid overly poetic or flowery language; keep it grounded and interesting.
    
    Also include TCG-style battle stats:
    - level: a number between 1 and 100
    - hp: a number between 40 and 200 (in increments of 10)
    - energyType: ${energyType ? `'${energyType}'` : "one of 'Fighting', 'Lightning', 'Grass', 'Fire', 'Water', 'Psychic'"}
    - attacks: an array of 2 objects, each with:
      - name: a witty attack name
      - description: a short, witty, and slightly humorous description
      - damage: a number between 10 and 120 (in increments of 10)
    - passiveAbility: an object with 'name' and 'description' (a unique trait)
    - topSpeed: estimated top speed in km/h
    - discoveryYear: the year the first fossils were discovered`,
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
              required: ['name', 'description', 'damage'],
            },
          },
          passiveAbility: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              description: { type: Type.STRING },
            },
            required: ['name', 'description'],
          },
          topSpeed: { type: Type.STRING },
          discoveryYear: { type: Type.STRING },
        },
        required: ['name', 'scientificName', 'period', 'diet', 'height', 'weight', 'location', 'funFact', 'description', 'rarity', 'level', 'hp', 'energyType', 'attacks', 'passiveAbility', 'topSpeed', 'discoveryYear'],
      },
    },

  });

  return JSON.parse(response.text || '{}') as DinoStats;
};

const getOldPrompt = (stats: DinoStats) => `A single, beautifully illustrated vintage-style collectible trading card featuring a cute, chibi-style dinosaur. The entire card is set against a solid dark black background, with the card itself having a textured, slightly worn cardstock finish and a prominent, weathered colored border.

Top Card Header:
The card’s colored border corresponds to its type (${stats.energyType}). The border has a slightly rough, vintage texture.
At the top left, the name of the dinosaur is written in a clear, friendly, rounded dark sans-serif font: ${stats.name.toUpperCase()}.
Next to the name, the text Lv.${stats.level} appears.
Further to the right, the text HP ${stats.hp} is displayed.
At the far right corner, a circular energy type symbol is prominently displayed, filled with a graphic icon for ${stats.energyType} and a slight texture.

Main Illustration (Inside Card Frame):
A distinct, hand-drawn illustration with bold, clean black outlines is contained within a rectangular frame.
The scene depicts an adorable, stylized cartoon version of the dinosaur in its natural prehistoric habitat (${stats.location}). The dinosaur has a gentle expression and simple blushes on its cheeks.
The habitat is rich in detail with muted, complementary colors: a stylized sun, soft clouds, rocky formations, and simple prehistoric foliage.
A small, circular speech bubble floats above the main dinosaur, containing a simple, friendly sound or phrase in all caps (e.g., "RAW R!", "HORNS UP!", "SWOOP!").

Bottom Attack Text Area:
The lower section of the card, within the main colored border, features the card’s attacks in a slightly darker background shade.
Each attack is listed sequentially:
1. ${stats.attacks[0].name}: ${stats.attacks[0].description} [${stats.attacks[0].damage} Damage]
2. ${stats.attacks[1].name}: ${stats.attacks[1].description} [${stats.attacks[1].damage} Damage]

Aesthetic Overtones:
The card has a distinct nostalgic 90s collectible card game feel, with a slightly textured, matte finish and hand-drawn quality. The line work is confident and charming.`;


export const generateDinoImage = async (stats: DinoStats, side: 'front' | 'back' = 'front', refImageName?: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  // Choose a random reference image if not provided
  const refImages = ['dino1.png', 'dino2.png', 'dino3.png'];
  const actualRef = refImageName || refImages[Math.floor(Math.random() * refImages.length)];

  // Fetch and convert reference image to base64
  const imageResponse = await fetch(`/src/assets/${actualRef}`);
  const imageBlob = await imageResponse.blob();
  const base64Data = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(imageBlob);
  });

  const energyColors: Record<string, string> = {
    'Fighting': 'Orange',
    'Water': 'Blue',
    'Lightning': 'Yellow',
    'Grass': 'Green',
    'Psychic': 'Pink',
    'Fire': 'Red'
  };
  const targetColor = energyColors[stats.energyType] || 'Yellow';

  const frontPrompt = `Create a new, unique dinosaur collectible trading card for "${stats.name}" that EXACTLY matches the visual style, layout, and aesthetic of the provided reference image.

Strictly adhere to these stylistic requirements:
1. CUSTOM TYPOGRAPHY: Use the exact font style, size, and placement for the Name (${stats.name.toUpperCase()}), Level (Lv.${stats.level}), HP (HP ${stats.hp}), and Energy Type (${stats.energyType}).
2. TEXTURE & WEAR: Replicate the weathered, slightly worn cardstock texture and the specific grain of the card.
3. COLOR PALETTE: THE BORDER AND ACCENTS MUST BE SPECIFICALLY ${targetColor}. IGNORE THE COLOR OF THE REFERENCE IMAGE AND USE ${targetColor} INSTEAD. This color must be very bold, obvious, and vintage in tone.
4. ILLUSTRATION STYLE: Create a hand-drawn, chibi-style illustration of a ${stats.name} in its habitat (${stats.location}). Maintain the bold, clean black outlines and the charming, simple character design from the reference.
5. CARD ELEMENTS: Include the rectangular illustration frame, the circular energy symbol, and the specific layout for attacks.
6. BACKGROUND: The card must be set against the same solid dark black background.`;

  const backPrompt = `Create the BACK SIDE of the dinosaur collectible trading card for "${stats.name}" that EXACTLY matches the visual style, typography, and aesthetic of the provided reference image. 

This is the reverse of the card shown in the reference. Strictly adhere to these requirements:
1. CONSISTENT COLORS: THE BORDER AND ACCENTS MUST BE SPECIFICALLY ${targetColor}. MATCH THE EXACT ${targetColor} COLOR USED ON THE FRONT SIDE. IGNORE THE COLOR OF THE REFERENCE IMAGE AND USE ${targetColor} INSTEAD.
2. TECHNICAL CENTERPIECE: Instead of an illustration of a living dinosaur, display a meticulously detailed, vintage-style 'Technical Fossil Sketch' (such as a skull, claw, or skeletal structure) of the ${stats.name} within the main card frame.
3. TECHNICAL DATA GRID: Display a beautifully formatted data grid using the exact same vintage typography style as the reference's text elements. Include:
   - SCIENTIFIC NAME: ${stats.scientificName}
   - DISCOVERY: ${stats.discoveryYear}
   - ABILITY: ${stats.passiveAbility.name.toUpperCase()} - ${stats.passiveAbility.description}
   - SPEED: ${stats.topSpeed}
4. CARD ATTRIBUTES: Include the Level (Lv.${stats.level}) and HP (HP ${stats.hp}) at the top, but layout the card as a technical data sheet.
5. TEXTURE & WEAR: Maintain the same weathered cardstock texture and worn edges as the reference.
6. BACKGROUND: Set against the same solid dark black background.

The goal is a card that looks like the perfect reverse side of the front, maintaining absolute set consistency.`;


  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        {
          inlineData: {
            data: base64Data,
            mimeType: "image/png"
          }
        },
        {
          text: side === 'front' ? frontPrompt : backPrompt,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: "3:4",
        imageSize: "1K"
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("Failed to generate image");
};
