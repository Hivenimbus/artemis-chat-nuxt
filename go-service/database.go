package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"

	_ "github.com/lib/pq"
)

var db *sql.DB

func InitDB() {
	connStr := os.Getenv("DATABASE_URL")
	if connStr == "" {
		log.Fatal("DATABASE_URL environment variable is not set")
	}

	var err error
	db, err = sql.Open("postgres", connStr)
	if err != nil {
		log.Fatal(err)
	}

	err = db.Ping()
	if err != nil {
		log.Fatal(err)
	}

	log.Println("Successfully connected to the database")
}

func GetPendingCampaigns() ([]Campaign, error) {
	query := `
		SELECT id, empresa_id, user_id, message_text, attachment_url, attachment_type, 
		       recipient_type, target_tags, scheduled_at, status, inbox_id, stats, created_at, updated_at
		FROM campanhas
		WHERE status = 'processing' 
		   OR (status = 'scheduled' AND scheduled_at <= NOW())
	`

	rows, err := db.Query(query)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var campaigns []Campaign
	for rows.Next() {
		var c Campaign
		// Handling potentially null stats column by reading into []byte first if needed, 
		// but Scan can handle []byte for jsonb/json columns.
		var statsBytes []byte
		var targetTagsBytes []byte

		err := rows.Scan(
			&c.ID, &c.EmpresaID, &c.UserID, &c.MessageText, &c.AttachmentURL, &c.AttachmentType,
			&c.RecipientType, &targetTagsBytes, &c.ScheduledAt, &c.Status, &c.InboxID, &statsBytes,
			&c.CreatedAt, &c.UpdatedAt,
		)
		if err != nil {
			log.Printf("Error scanning campaign: %v", err)
			continue
		}
		
		c.TargetTags = targetTagsBytes
		c.Stats = statsBytes
		campaigns = append(campaigns, c)
	}

	return campaigns, nil
}

func GetCampaignContacts(c Campaign) ([]Contact, error) {
	var contacts []Contact
	var query string
	var args []interface{}

	if c.RecipientType == "all" {
		query = `SELECT id, nome, sobrenome, telefone, empresa_id, total_mensagens 
		         FROM contatos WHERE empresa_id = $1`
		args = append(args, c.EmpresaID)
	} else if c.RecipientType == "tags" {
		// target_tags is expected to be a JSON array of strings (UUIDs)
		query = `
			SELECT DISTINCT c.id, c.nome, c.sobrenome, c.telefone, c.empresa_id, c.total_mensagens
			FROM contatos c
			JOIN contato_etiquetas ce ON c.id = ce.contato_id
			WHERE c.empresa_id = $1
			AND ce.etiqueta_id::text = ANY (
				SELECT jsonb_array_elements_text($2::jsonb)
			)
		`
		args = append(args, c.EmpresaID, c.TargetTags)
	} else {
		return nil, fmt.Errorf("unknown recipient type: %s", c.RecipientType)
	}

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var contact Contact
		err := rows.Scan(
			&contact.ID, &contact.Nome, &contact.Sobrenome, &contact.Telefone, 
			&contact.EmpresaID, &contact.TotalMensagens,
		)
		if err != nil {
			log.Printf("Error scanning contact: %v", err)
			continue
		}
		contacts = append(contacts, contact)
	}

	return contacts, nil
}

func UpdateCampaignStatus(id string, status string, stats CampaignStats) error {
	statsJSON, err := json.Marshal(stats)
	if err != nil {
		return err
	}

	query := `
		UPDATE campanhas 
		SET status = $1, stats = $2, updated_at = NOW()
		WHERE id = $3
	`
	_, err = db.Exec(query, status, statsJSON, id)
	return err
}

func MarkCampaignAsSending(id string) error {
	query := `UPDATE campanhas SET status = 'sending', updated_at = NOW() WHERE id = $1`
	_, err := db.Exec(query, id)
	return err
}



