package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

var pool *pgxpool.Pool

func InitDB() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("❌ DATABASE_URL must be set in .env")
	}

	var err error
	pool, err = pgxpool.New(context.Background(), databaseURL)
	if err != nil {
		log.Fatalf("❌ Failed to connect to database: %v", err)
	}

	if err := pool.Ping(context.Background()); err != nil {
		log.Fatalf("❌ Failed to ping database: %v", err)
	}

	log.Println("✅ Successfully initialized PostgreSQL connection pool")
}

func GetPendingCampaigns() ([]Campaign, error) {
	ctx := context.Background()

	rows, err := pool.Query(ctx, `
		SELECT id, empresa_id, user_id, message_text, attachment_url, attachment_type,
		       recipient_type, target_tags, scheduled_at, status, inbox_id, attachments, stats,
		       created_at, updated_at
		FROM campanhas
		WHERE status = 'processing'
		   OR (status = 'scheduled' AND scheduled_at <= NOW())
	`)
	if err != nil {
		return nil, fmt.Errorf("error querying pending campaigns: %w", err)
	}
	defer rows.Close()

	var campaigns []Campaign
	for rows.Next() {
		var c Campaign
		var targetTagsBytes, attachmentsBytes, statsBytes []byte
		err := rows.Scan(
			&c.ID, &c.EmpresaID, &c.UserID, &c.MessageText, &c.AttachmentURL, &c.AttachmentType,
			&c.RecipientType, &targetTagsBytes, &c.ScheduledAt, &c.Status, &c.InboxID,
			&attachmentsBytes, &statsBytes, &c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("error scanning campaign: %w", err)
		}
		c.TargetTags = json.RawMessage(targetTagsBytes)
		c.Attachments = json.RawMessage(attachmentsBytes)
		c.Stats = json.RawMessage(statsBytes)
		campaigns = append(campaigns, c)
	}

	if len(campaigns) > 0 {
		log.Printf("📥 GetPendingCampaigns found %d campaigns", len(campaigns))
	}

	return campaigns, nil
}

func GetCampaignContacts(c Campaign) ([]Contact, error) {
	log.Printf("🔎 Fetching contacts for campaign %s (Type: %s)", c.ID, c.RecipientType)
	ctx := context.Background()

	var contacts []Contact

	if c.RecipientType == "all" {
		rows, err := pool.Query(ctx, `
			SELECT id, nome, sobrenome, telefone, empresa_id, COALESCE(total_mensagens, 0)
			FROM contatos
			WHERE empresa_id = $1
		`, c.EmpresaID)
		if err != nil {
			return nil, fmt.Errorf("error querying contacts (all): %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var ct Contact
			if err := rows.Scan(&ct.ID, &ct.Nome, &ct.Sobrenome, &ct.Telefone, &ct.EmpresaID, &ct.TotalMensagens); err != nil {
				return nil, fmt.Errorf("error scanning contact: %w", err)
			}
			contacts = append(contacts, ct)
		}

	} else if c.RecipientType == "tags" {
		var tagIDs []string
		if err := json.Unmarshal(c.TargetTags, &tagIDs); err != nil {
			return nil, fmt.Errorf("error parsing target tags: %w", err)
		}

		if len(tagIDs) == 0 {
			return []Contact{}, nil
		}

		// Step 1: Get unique contact IDs with these tags
		tagRows, err := pool.Query(ctx, `
			SELECT DISTINCT contato_id
			FROM contato_etiquetas
			WHERE etiqueta_id = ANY($1)
		`, tagIDs)
		if err != nil {
			return nil, fmt.Errorf("error querying contact tags: %w", err)
		}
		defer tagRows.Close()

		var contactIDs []string
		for tagRows.Next() {
			var id string
			if err := tagRows.Scan(&id); err != nil {
				return nil, fmt.Errorf("error scanning contact tag: %w", err)
			}
			contactIDs = append(contactIDs, id)
		}

		if len(contactIDs) == 0 {
			return []Contact{}, nil
		}

		// Step 2: Fetch contacts
		rows, err := pool.Query(ctx, `
			SELECT id, nome, sobrenome, telefone, empresa_id, COALESCE(total_mensagens, 0)
			FROM contatos
			WHERE empresa_id = $1 AND id = ANY($2)
		`, c.EmpresaID, contactIDs)
		if err != nil {
			return nil, fmt.Errorf("error querying contacts (tags): %w", err)
		}
		defer rows.Close()

		for rows.Next() {
			var ct Contact
			if err := rows.Scan(&ct.ID, &ct.Nome, &ct.Sobrenome, &ct.Telefone, &ct.EmpresaID, &ct.TotalMensagens); err != nil {
				return nil, fmt.Errorf("error scanning contact: %w", err)
			}
			contacts = append(contacts, ct)
		}

	} else {
		return nil, fmt.Errorf("unknown recipient type: %s", c.RecipientType)
	}

	log.Printf("👥 Found %d contacts for campaign %s", len(contacts), c.ID)
	return contacts, nil
}

func UpdateCampaignStatus(id string, status string, stats CampaignStats) error {
	log.Printf("💾 Updating campaign %s status to '%s' (Sent: %d, Failed: %d)", id, status, stats.Sent, stats.Failed)

	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return fmt.Errorf("error marshaling stats: %w", err)
	}

	_, err = pool.Exec(context.Background(), `
		UPDATE campanhas
		SET status = $1, stats = $2, updated_at = $3
		WHERE id = $4
	`, status, statsJSON, time.Now(), id)
	if err != nil {
		log.Printf("❌ Error updating campaign status in DB: %v", err)
		return err
	}
	return nil
}

func MarkCampaignAsSending(id string) error {
	log.Printf("🔄 Marking campaign %s as 'sending'", id)

	_, err := pool.Exec(context.Background(), `
		UPDATE campanhas
		SET status = 'sending', updated_at = $1
		WHERE id = $2
	`, time.Now(), id)
	if err != nil {
		log.Printf("❌ Error marking campaign as sending in DB: %v", err)
		return err
	}
	return nil
}

func GetCampaignStatus(id string) (string, error) {
	var status string
	err := pool.QueryRow(context.Background(), `
		SELECT status FROM campanhas WHERE id = $1
	`, id).Scan(&status)
	if err != nil {
		return "", fmt.Errorf("error fetching campaign status: %w", err)
	}
	return status, nil
}
