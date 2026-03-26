import { Router } from 'express';
import { getLevels } from '../lib/queries.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const levels = await getLevels();
  res.json(levels);
});

router.get('/ganancias', authenticate, async (req, res) => {
  const levels = await getLevels();
  res.json(levels.map(l => ({
    ...l,
    ingreso_mensual: l.deposito ? (l.ingreso_diario || 0) * 30 : null,
    ingreso_anual: l.deposito ? (l.ingreso_diario || 0) * 365 : null,
  })));
});

export default router;
