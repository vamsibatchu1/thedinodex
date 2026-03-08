import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import fs from 'fs';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'dino-save-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/save-card' && req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const { name, imageBase64, stats } = JSON.parse(body);
                  const baseName = name.toLowerCase().replace(/\s+/g, '-');
                  const fileName = `${baseName}-front.png`;

                  // Use absolute paths
                  const outputDir = path.join(process.cwd(), 'public', 'collection');
                  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

                  const imagePath = path.join(outputDir, fileName);
                  fs.writeFileSync(imagePath, Buffer.from(imageBase64, 'base64'));

                  const manifestPath = path.join(outputDir, 'manifest.json');
                  let manifest = [];
                  if (fs.existsSync(manifestPath)) {
                    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                  }

                  const existingIdx = manifest.findIndex((m: any) => m.stats.name.toLowerCase() === name.toLowerCase());
                  const newEntry = {
                    stats,
                    imageUrl: `/collection/${fileName}`,
                    backImageUrl: ""
                  };

                  if (existingIdx >= 0) {
                    manifest[existingIdx] = newEntry;
                  } else {
                    manifest.push(newEntry);
                  }

                  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: true }));
                } catch (err: any) {
                  res.statusCode = 500;
                  res.end(JSON.stringify({ error: err.message }));
                }
              });
              return;
            }
            next();
          });
        }
      }
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
