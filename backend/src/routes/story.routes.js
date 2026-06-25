import { Router }       from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const STORY_PATH = join(__dir, '../../../../docs/historia-guyunusa.md');

const router = Router();

// Endpoint público — no requiere auth
router.get('/', (_req, res) => {
  try {
    const content = readFileSync(STORY_PATH, 'utf-8');
    res.json({ ok: true, content });
  } catch {
    res.status(404).json({ ok: false, message: 'Historia no encontrada' });
  }
});

export default router;
