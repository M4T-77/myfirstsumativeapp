import { z } from 'zod';

export const contentSchema = z.string()
  .min(10, 'El contenido debe tener al menos 10 caracteres')
  .max(5000, 'El contenido es demasiado largo (máximo 5000 caracteres)');
