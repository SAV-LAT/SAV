import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import taskRoutes from './routes/tasks.js';
import levelRoutes from './routes/levels.js';
import rechargeRoutes from './routes/recharges.js';
import withdrawalRoutes from './routes/withdrawals.js';
import adminRoutes from './routes/admin.js';
import sorteoRoutes from './routes/sorteo.js';
import telegramWebhookRoutes from './routes/telegram_webhook.js';
import { getPublicContent, getBanners } from './lib/queries.js';
import { mergePublicContent } from './data/publicContentDefaults.js';

console.log('\n[SERVER] Proceso de servidor iniciado. BUILD_ID: ' + Date.now());
console.log('[SERVER] Versión: 3.0.1 - MIME Fix');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 4000;

// Logger simple para ver peticiones en Render
app.use((req, res, next) => {
  console.log(`[REQUEST] ${req.method} ${req.url} - Origin: ${req.headers.origin}`);
  next();
});

// Configuración de CORS estricta para producción
console.log('[SERVER] Configurando CORS...');
const whitelist = [
  'https://sav-proyecto.vercel.app', // Dominio de producción en Vercel
  'https://sav-iouoxrj8r-moicon123s-projects.vercel.app', // Dominio de despliegue en Vercel
  'http://localhost:5173',          // Entorno de desarrollo local
  'http://127.0.0.1:5173'
];

if (process.env.FRONTEND_URL) {
  whitelist.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: function (origin, callback) {
    // Permitir todas las peticiones si no hay origin (como herramientas de prueba) o si está en la lista blanca
    if (!origin || whitelist.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      console.error(`[CORS] Petición bloqueada desde origen no permitido: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400
};
app.use(cors(corsOptions));
console.log('[SERVER] CORS configurado.');

console.log('[SERVER] Configurando parsers y archivos estáticos...');
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Middleware para servir videos con cabeceras que eviten errores de caché
const videoHeaderMiddleware = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Servir archivos estáticos del frontend y carpetas de medios
app.use('/imag', express.static(path.join(__dirname, '../../frontend/public/imag')));
app.use('/video', videoHeaderMiddleware, express.static(path.join(__dirname, '../../frontend/public/video')));
app.use('/videos', videoHeaderMiddleware, express.static(path.join(__dirname, '../../frontend/public/video')));
console.log('[SERVER] Rutas estáticas configuradas.');

console.log('[SERVER] Configurando rutas de API...');
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/levels', levelRoutes);
app.use('/api/recharges', rechargeRoutes);
app.use('/api/withdrawals', withdrawalRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/sorteo', sorteoRoutes);
app.use('/api/telegram-webhook', telegramWebhookRoutes);
console.log('[SERVER] Rutas de API configuradas.');

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'SAV API is alive!' });
});

app.get('/api/banners', async (req, res) => {
  const banners = await getBanners();
  res.json(banners);
});

app.get('/api/public-content', async (req, res) => {
  const config = await getPublicContent();
  res.json(mergePublicContent(config));
});

app.listen(PORT, async () => {
  console.log(`\n[SUCCESS] ¡Servidor SAV API escuchando en http://localhost:${PORT}!\n`);
  
  // Tarea de mantenimiento: Reset de ganancias diarias a las 00:00 Bolivia (UTC-4)
  const setupCron = async () => {
    const { resetDailyEarnings } = await import('./lib/queries.js');
    
    const checkReset = () => {
      const now = new Date();
      const boliviaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/La_Paz' }));
      
      // Si son entre las 00:00 y las 00:05 AM, ejecutar reset
      if (boliviaTime.getHours() === 0 && boliviaTime.getMinutes() < 5) {
        resetDailyEarnings();
      }
    };
    
    // Revisar cada 5 minutos
    setInterval(checkReset, 5 * 60 * 1000);
    console.log('[CRON] Sistema de reset diario iniciado.');
  };
  
  setupCron().catch(err => console.error('[CRON] Error al iniciar:', err));
});
