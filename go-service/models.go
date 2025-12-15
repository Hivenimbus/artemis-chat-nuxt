package main

import (
	"database/sql"
	"encoding/json"
	"time"
)

// Campaign represents the 'campanhas' table
type Campaign struct {
	ID             string          `json:"id"`
	EmpresaID      string          `json:"empresa_id"`
	UserID         string          `json:"user_id"`
	MessageText    sql.NullString  `json:"message_text"`
	AttachmentURL  sql.NullString  `json:"attachment_url"`
	AttachmentType sql.NullString  `json:"attachment_type"`
	RecipientType  string          `json:"recipient_type"`
	TargetTags     json.RawMessage `json:"target_tags"` // JSONB array of tag IDs
	ScheduledAt    sql.NullTime    `json:"scheduled_at"`
	Status         string          `json:"status"`
	InboxID        sql.NullString  `json:"inbox_id"`
	Stats          json.RawMessage `json:"stats"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

// Contact represents the 'contatos' table
type Contact struct {
	ID             string         `json:"id"`
	Nome           string         `json:"nome"`
	Sobrenome      sql.NullString `json:"sobrenome"`
	Telefone       string         `json:"telefone"`
	EmpresaID      string         `json:"empresa_id"`
	TotalMensagens int            `json:"total_mensagens"`
}

// EvolutionTextMessage represents the payload for sending text
type EvolutionTextMessage struct {
	Number string `json:"number"`
	Text   string `json:"text"`
}

// EvolutionMediaMessage represents the payload for sending media
type EvolutionMediaMessage struct {
	Number   string `json:"number"`
	Type     string `json:"type"` // image, video, document, audio
	URL      string `json:"url"`
	Caption  string `json:"caption,omitempty"`
	MimeType string `json:"mimetype,omitempty"`
	FileName string `json:"fileName,omitempty"`
}

// CampaignStats stores the progress of the campaign
type CampaignStats struct {
	Total     int `json:"total"`
	Processed int `json:"processed"`
	Sent      int `json:"sent"`
	Failed    int `json:"failed"`
}



