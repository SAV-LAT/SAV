-- Migración para trazabilidad de retiros y perfiles de administrador Telegram
-- Ejecutar en Supabase SQL Editor

-- 1. Agregar campos de Telegram a la tabla de usuarios (que ya tiene el rol 'admin')
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(50) UNIQUE,
ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_linked_at TIMESTAMPTZ;

-- 2. Mejorar la tabla de retiros para trazabilidad completa
ALTER TABLE retiros 
ADD COLUMN IF NOT EXISTS taken_by_admin_id UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS taken_by_admin_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS taken_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processed_by_admin_name VARCHAR(200),
ADD COLUMN IF NOT EXISTS rejected_by_admin_id UUID REFERENCES usuarios(id),
ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS telegram_message_id VARCHAR(100),
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100);

-- 3. Asegurar que el estado 'en_proceso' sea válido (aunque es VARCHAR, es bueno documentarlo)
-- Los estados serán: 'pendiente', 'en_proceso', 'pagado', 'rechazado'

-- 4. Índice para búsquedas rápidas por telegram_user_id
CREATE INDEX IF NOT EXISTS idx_usuarios_telegram_id ON usuarios(telegram_user_id);
CREATE INDEX IF NOT EXISTS idx_retiros_taken_by ON retiros(taken_by_admin_id);
