package main

import (
	"encoding/json"
	"time"
)

// Campaign represents the 'campanhas' table
type Campaign struct {
	ID             string          `json:"id"`
	EmpresaID      string          `json:"empresa_id"`
	UserID         string          `json:"user_id"`
	MessageText    *string         `json:"message_text"`
	AttachmentURL  *string         `json:"attachment_url"`
	AttachmentType *string         `json:"attachment_type"`
	RecipientType  string          `json:"recipient_type"`
	TargetTags     json.RawMessage `json:"target_tags"` // JSONB array of tag IDs
	ScheduledAt    *time.Time      `json:"scheduled_at"`
	Status         string          `json:"status"`
	InboxID        *string         `json:"inbox_id"`
	Attachments    json.RawMessage `json:"attachments"` // JSONB array of attachments
	Stats          json.RawMessage `json:"stats"`
	CreatedAt      time.Time       `json:"created_at"`
	UpdatedAt      time.Time       `json:"updated_at"`
}

// Attachment represents the structure inside the JSONB array
type Attachment struct {
	URL     string `json:"url"`
	Type    string `json:"type"`
	Caption string `json:"caption"`
}

// Contact represents the 'contatos' table
type Contact struct {
	ID             string  `json:"id"`
	Nome           string  `json:"nome"`
	Sobrenome      *string `json:"sobrenome"`
	Telefone       string  `json:"telefone"`
	EmpresaID      string  `json:"empresa_id"`
	TotalMensagens int     `json:"total_mensagens"`
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
