import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

function syncStatus() {
    const collectionDir = path.join(__dirname, '..', 'public', 'collection');
    const statusPath = path.join(__dirname, 'generation-status.json');
    const manifestPath = path.join(collectionDir, 'manifest.json');

    let manifest = [];
    if (fs.existsSync(manifestPath)) {
        manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    }

    const statusMap = {};

    for (const name of DINO_NAMES) {
        const baseName = name.toLowerCase().replace(/\s+/g, '-');
        const frontPath = path.join(collectionDir, `${baseName}-front.png`);
        const backPath = path.join(collectionDir, `${baseName}-back.png`);

        const manifestEntry = manifest.find(m => m.stats.name.toLowerCase() === name.toLowerCase());

        statusMap[name] = {
            front: fs.existsSync(frontPath),
            back: fs.existsSync(backPath),
            stats: !!manifestEntry
        };
    }

    fs.writeFileSync(statusPath, JSON.stringify(statusMap, null, 2));
    console.log(`Successfully synchronized status for ${DINO_NAMES.length} dinosaurs.`);

    // Summary
    const totalCount = DINO_NAMES.length;
    const frontCount = Object.values(statusMap).filter((s: any) => s.front).length;
    const backCount = Object.values(statusMap).filter((s: any) => s.back).length;

    console.log(`--- PROGRESS ---`);
    console.log(`Front Images: ${frontCount}/${totalCount}`);
    console.log(`Back Images:  ${backCount}/${totalCount}`);
}

syncStatus();
