import { GoogleGenAI, Type } from "@google/genai";
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("No API Key found in .env");
    process.exit(1);
}

const ai = new GoogleGenAI({ apiKey });

const ENERGY_COLORS: Record<string, string> = {
    'Fighting': 'Orange',
    'Water': 'Blue',
    'Lightning': 'Yellow',
    'Grass': 'Green',
    'Psychic': 'Pink',
    'Fire': 'Red'
};

async function generateDinoBackImage(stats: any, frontImagePath: string): Promise<string | null> {
    console.log(`[IMAGE] Generating back for ${stats.name}...`);
    try {
        const targetColor = ENERGY_COLORS[stats.energyType] || 'Yellow';

        // Load and resize the front image as the reference for consistency
        if (!fs.existsSync(frontImagePath)) {
            console.error(`Front image not found: ${frontImagePath}`);
            return null;
        }

        // Resize to 512px width to speed up upload/processing while keeping style visible
        const resizedBuffer = await sharp(frontImagePath)
            .resize(512)
            .png()
            .toBuffer();

        const base64Data = resizedBuffer.toString('base64');

        const prompt = `Create the REVERSE (BACK SIDE) of the collectible dinosaur trading card for "${stats.name}". 
Use the provided FRONT SIDE image ONLY as a reference for the card's specific weathered texture, worn edges, and its focal theme color: ${targetColor}.

Design Requirements (Inspired by 1970s/80s Baseball Cards):
1. VINTAGE BACKSIDE TEXTURE: The back of the card must be a different texture than the front. Use an off-white or light-grey "recycled cardboard" or porous paper finish. All text and lines should look like they were printed with slightly flat, matte ${targetColor} ink.
2. VITAL STATS HEADER (Top Section):
   - Display "${stats.name.toUpperCase()}" in a large, bold, vintage sports-style blocky font.
   - A grid of technical info: SCIENTIFIC NAME: ${stats.scientificName}, PERIOD: ${stats.period}, DISCOVERY: ${stats.discoveryYear}, DIET: ${stats.diet}.
3. TRIVIA BOX (Top Right Graphic Area):
   - Include a small, playful cartoon mascot (like a chibi dino or a paleontologist icon).
   - A trivia question: "Q: Did you know? A: ${stats.funFact}" written in a fun, vintage display font.
4. FIELD LOG (Main Bio Area):
   - A prominent, large rectangular block filled with a solid but slightly faded wash of ${targetColor}.
   - The title "FIELD LOG" or "SPECIMEN BIO" at the top of this block.
   - The following text cleanly typeset inside: "${stats.description}"
5. GEOLOGICAL RECORD (Bottom Statistical Table):
   - A clean statistical grid/table with headers: [ERA] [REGION] [HEIGHT] [WEIGHT].
   - Corresponding data rows: [Mesozoic] [${stats.location}] [${stats.height}] [${stats.weight}].
6. AESTHETIC: High data density, mix of bold and condensed vintage fonts. The card should feel like a nostalgic physical object from a 1980s museum gift set.
7. BACKGROUND: The entire card (back side) must be set against the exact same solid dark black background as the front side reference.

Ensuring absolute set consistency in color and texture while delivering a totally new, satisfyingly vintage data-sheet layout.`;

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
        console.error(`Back image generation failed for ${stats.name}:`, e.message);
    }
    return null;
}

async function run() {
    const outputDir = path.join(__dirname, '..', 'public', 'collection');
    const manifestPath = path.join(outputDir, 'manifest.json');
    const statusPath = path.join(__dirname, 'generation-status.json');

    if (!fs.existsSync(manifestPath)) {
        console.error("Manifest not found at " + manifestPath);
        process.exit(1);
    }

    if (!fs.existsSync(statusPath)) {
        console.error("Status file not found at " + statusPath);
        process.exit(1);
    }

    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const statusMap = JSON.parse(fs.readFileSync(statusPath, 'utf8'));

    // Filter to only dinos that the status file says are missing backs
    const pendingDinos = manifest.filter((m: any) => {
        const name = m.stats.name;
        return statusMap[name] && statusMap[name].back === false;
    });

    console.log(`Starting BACKSIDE generation based on checklist...`);
    console.log(`Remaining: ${pendingDinos.length} / Total: ${manifest.length}`);

    let count = 0;
    for (const item of pendingDinos) {
        count++;
        const stats = item.stats;
        const frontFileName = path.basename(item.frontImageUrl || item.imageUrl);
        const frontImagePath = path.join(outputDir, frontFileName);

        console.log(`[${count}/${pendingDinos.length}] Processing ${stats.name}...`);

        const startTime = Date.now();
        const backBase64 = await generateDinoBackImage(stats, frontImagePath);
        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        if (backBase64) {
            const baseName = stats.name.toLowerCase().replace(/\s+/g, '-');
            const backFileName = `${baseName}-back.png`;
            fs.writeFileSync(path.join(outputDir, backFileName), Buffer.from(backBase64, 'base64'));

            // Update Manifest
            item.backImageUrl = `/collection/${backFileName}`;
            fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

            // Update Status File
            statusMap[stats.name].back = true;
            fs.writeFileSync(statusPath, JSON.stringify(statusMap, null, 2));

            console.log(`[SUCCESS] Generated back for ${stats.name} in ${duration}s`);
        } else {
            console.log(`[FAILED] Could not generate back for ${stats.name} after ${duration}s`);
        }

        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    console.log("Checklist generation run complete!");
}

run();
