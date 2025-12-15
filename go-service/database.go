package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os"
	"time"

	"github.com/nedpals/supabase-go"
)

var client *supabase.Client

func InitDB() {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SECRET_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Fatal("❌ SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env")
	}

	client = supabase.CreateClient(supabaseURL, supabaseKey)
	log.Println("✅ Successfully initialized Supabase client")
}

func GetPendingCampaigns() ([]Campaign, error) {
	var campaigns []Campaign
	var processingCampaigns []Campaign
	var scheduledCampaigns []Campaign

	// Query 1: Status = 'processing'
	err := client.DB.From("campanhas").Select("*").Eq("status", "processing").Execute(&processingCampaigns)
	if err != nil {
		return nil, fmt.Errorf("error querying processing campaigns: %w", err)
	}
	campaigns = append(campaigns, processingCampaigns...)

	// Query 2: Status = 'scheduled' AND scheduled_at <= NOW()
	now := time.Now().Format(time.RFC3339)
	err = client.DB.From("campanhas").
		Select("*").
		Eq("status", "scheduled").
		Lte("scheduled_at", now).
		Execute(&scheduledCampaigns)
		
	if err != nil {
		return nil, fmt.Errorf("error querying scheduled campaigns: %w", err)
	}
	campaigns = append(campaigns, scheduledCampaigns...)

	if len(campaigns) > 0 {
		log.Printf("📥 GetPendingCampaigns found %d campaigns", len(campaigns))
	}

	return campaigns, nil
}

func GetCampaignContacts(c Campaign) ([]Contact, error) {
	log.Printf("🔎 Fetching contacts for campaign %s (Type: %s)", c.ID, c.RecipientType)

	var contacts []Contact

	if c.RecipientType == "all" {
		err := client.DB.From("contatos").Select("*").Eq("empresa_id", c.EmpresaID).Execute(&contacts)
		if err != nil {
			return nil, fmt.Errorf("error querying contacts (all): %w", err)
		}
	} else if c.RecipientType == "tags" {
		// Parse target tags from JSON
		var tagIDs []string
		if err := json.Unmarshal(c.TargetTags, &tagIDs); err != nil {
			return nil, fmt.Errorf("error parsing target tags: %w", err)
		}
		
		if len(tagIDs) == 0 {
			return []Contact{}, nil
		}

		// Step 1: Get contact IDs that have these tags
		type ContatoEtiqueta struct {
			ContatoID string `json:"contato_id"`
		}
		
		var contactTags []ContatoEtiqueta
		
		err := client.DB.From("contato_etiquetas").
			Select("contato_id").
			In("etiqueta_id", tagIDs).
			Execute(&contactTags)
			
		if err != nil {
			return nil, fmt.Errorf("error querying contact tags: %w", err)
		}
		
		if len(contactTags) == 0 {
			return []Contact{}, nil
		}
		
		// Collect unique IDs
		uniqueIDs := make(map[string]bool)
		var ids []string
		for _, ct := range contactTags {
			if !uniqueIDs[ct.ContatoID] {
				uniqueIDs[ct.ContatoID] = true
				ids = append(ids, ct.ContatoID)
			}
		}
		
		// Step 2: Fetch contacts
		err = client.DB.From("contatos").
			Select("*").
			Eq("empresa_id", c.EmpresaID).
			In("id", ids).
			Execute(&contacts)
			
		if err != nil {
			return nil, fmt.Errorf("error querying contacts (tags): %w", err)
		}

	} else {
		return nil, fmt.Errorf("unknown recipient type: %s", c.RecipientType)
	}

	log.Printf("👥 Found %d contacts for campaign %s", len(contacts), c.ID)
	return contacts, nil
}

func UpdateCampaignStatus(id string, status string, stats CampaignStats) error {
	log.Printf("💾 Updating campaign %s status to '%s' (Sent: %d, Failed: %d)", id, status, stats.Sent, stats.Failed)
	
	updateData := map[string]interface{}{
		"status":     status,
		"stats":      stats,
		"updated_at": time.Now(),
	}

	var results []Campaign
	err := client.DB.From("campanhas").Update(updateData).Eq("id", id).Execute(&results)
	if err != nil {
		log.Printf("❌ Error updating campaign status in DB: %v", err)
		return err
	}
	return nil
}

func MarkCampaignAsSending(id string) error {
	// Use 'processing' instead of 'sending' to respect DB constraints if needed, 
	// or stick to 'sending' if your updated schema allows it.
	// Based on previous code context, we assume 'sending' is what we want, 
	// but if the constraint fails, we might need to change to 'processing'.
	// Keeping 'sending' as per user plan request.
	log.Printf("🔄 Marking campaign %s as 'sending'", id)
	
	updateData := map[string]interface{}{
		"status":     "sending",
		"updated_at": time.Now(),
	}

	var results []Campaign
	err := client.DB.From("campanhas").Update(updateData).Eq("id", id).Execute(&results)
	if err != nil {
		log.Printf("❌ Error marking campaign as sending in DB: %v", err)
		return err
	}
	return nil
}
