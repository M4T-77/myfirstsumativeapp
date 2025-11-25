import { z } from 'zod';

export const titleSchema = z.string()
  .min(1, 'El título no puede estar vacío')
  .max(100, 'El título es demasiado largo (máximo 100 caracteres)')
  .regex(/^[a-zA-Z0-9 ]+$/, 'El título solo puede contener letras, números y espacios');