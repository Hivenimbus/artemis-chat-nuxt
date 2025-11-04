-- Adicionar colunas para suporte a mídias e integração com Evolution API
ALTER TABLE mensagens
ADD COLUMN IF NOT EXISTS message_type VARCHAR(20) DEFAULT 'text',
ADD COLUMN IF NOT EXISTS media_url TEXT,
ADD COLUMN IF NOT EXISTS media_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS media_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS evolution_message_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS evolution_status VARCHAR(20) DEFAULT 'pending';

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_mensagens_message_type ON mensagens(message_type);
CREATE INDEX IF NOT EXISTS idx_mensagens_evolution_message_id ON mensagens(evolution_message_id);
CREATE INDEX IF NOT EXISTS idx_mensagens_evolution_status ON mensagens(evolution_status);

-- Adicionar comentários
COMMENT ON COLUMN mensagens.message_type IS 'Tipo da mensagem: text, image, video, audio, document';
COMMENT ON COLUMN mensagens.media_url IS 'URL da mídia armazenada no Supabase Storage';
COMMENT ON COLUMN mensagens.media_type IS 'MIME type da mídia';
COMMENT ON COLUMN mensagens.media_name IS 'Nome original do arquivo de mídia';
COMMENT ON COLUMN mensagens.evolution_message_id IS 'ID da mensagem na Evolution API';
COMMENT ON COLUMN mensagens.evolution_status IS 'Status da mensagem na Evolution API: pending, sent, delivered, read, failed';