import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";

dotenv.config();

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const DINO_NAMES = [
    "Tyrannosaurus Rex", "Velociraptor", "Spinosaurus", "Allosaurus",
    "Carnotaurus", "Dilophosaurus", "Compsognathus", "Gallimimus",
    "Baryonyx", "Deinonychus", "Giganotosaurus", "Archaeopteryx",
    "Acrocanthosaurus", "Carcharodontosaurus", "Metriacanthosaurus", "Albertosaurus",
    "Tarbosaurus", "Megalosaurus", "Ceratosaurus", "Coelophysis",
    "Cryolophosaurus", "Daspletosaurus", "Gorgosaurus", "Herrerasaurus",
    "Irritator", "Majungasaurus", "Microraptor", "Ornithomimus",
    "Rajasaurus", "Troodon", "Utahraptor", "Guanlong",
    "Ornitholestes", "Pyroraptor", "Qianzhousaurus", "Sinosauropteryx",
    "Yangchuanosaurus", "Yutyrannus", "Abelisaurus",
    "Brachiosaurus", "Apatosaurus", "Diplodocus", "Plateosaurus",
    "Saltasaurus", "Shunosaurus", "Amargasaurus", "Shantungosaurus",
    "Dreadnoughtus", "Mamenchisaurus", "Titanosaurus", "Dicraeosaurus",
    "Gondwanatitan", "Nemegtosaurus", "Opisthocoelicaudia", "Patagosaurus",
    "Sauroposeidon",
    "Stegosaurus", "Ankylosaurus", "Kentrosaurus", "Saichania",
    "Gastonia", "Minmi", "Wuerhosaurus", "Euoplocephalus",
    "Lexovisaurus", "Polacanthus", "Nodosaurus",
    "Triceratops", "Pachycephalosaurus", "Styracosaurus", "Torosaurus",
    "Pachyrhinosaurus", "Chasmosaurus", "Pentaceratops", "Protoceratops",
    "Sinoceratops", "Zuniceratops", "Monoclonius", "Psittacosaurus",
    "Parasaurolophus", "Iguanodon", "Ouranosaurus", "Maiasaura",
    "Oviraptor", "Edmontosaurus", "Lambeosaurus", "Hadrosaurus",
    "Kulindadromeus", "Saurolophus", "Hypsilophodon", "Linhenykus",
    "Scansoriopteryx", "Suzhousaurus",
    "Mosasaurus", "Pteranodon", "Futabasaurus"
];

async function getLocations() {
    console.log(`Generating coordinates for ${DINO_NAMES.length} dinosaurs...`);

    const prompt = `You are a professional paleontologist. For the following list of dinosaur names, find the exact geographical coordinates (Latitude and Longitude) where their fossils were primarily or most famously discovered. 
  
  IMPORTANT:
  - T-Rex fossils are famously from Hell Creek, North America (approx 45.0, -106.0).
  - Rajasaurus was famously found in India (approx 23.0, 73.0).
  - Futabasaurus was found in Japan (approx 37.0, 140.0).
  - Archaeopteryx in Germany (approx 48.0, 11.0).
  - Make sure Velociraptor is in Mongolia/China, Giganotosaurus in Argentina, Spinosaurus in North Africa, etc.
  - ALL coordinates MUST be on LAND.
  
  Provide the information in a JSON format where each key is the dinosaur name and the value is an object with "lat" and "lng" keys.
  
  Dinosaur List: ${DINO_NAMES.join(", ")}
  
  Output ONLY the JSON.`;

    try {
        const result = await genAI.models.generateContent({
            model: "gemini-3.1-flash-lite-preview",
            contents: prompt
        });

        let text = result.text || "";

        // Clean JSON markdown if present
        text = text.replace(/```json\n?/, "").replace(/```/, "").trim();

        const locations = JSON.parse(text);

        const dataDir = path.join(process.cwd(), "src", "data");
        const dataPath = path.join(dataDir, "dino_locations.json");

        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(dataPath, JSON.stringify(locations, null, 2));
        console.log(`Successfully saved ${Object.keys(locations).length} locations to ${dataPath}`);
    } catch (error) {
        console.error("Error generating locations:", error);
    }
}

getLocations();
