package main

import (
	"log"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Load .env file
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found, using environment variables")
	}

	// Initialize Database
	InitDB()
	defer db.Close()

	log.Println("Starting Artemis Campaign Worker...")

	// Ticker for polling
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	for range ticker.C {
		processCampaigns()
	}
}

func processCampaigns() {
	campaigns, err := GetPendingCampaigns()
	if err != nil {
		log.Printf("Error fetching pending campaigns: %v", err)
		return
	}

	if len(campaigns) > 0 {
		log.Printf("Found %d pending campaigns", len(campaigns))
	}

	for _, campaign := range campaigns {
		processSingleCampaign(campaign)
	}
}

func processSingleCampaign(campaign Campaign) {
	log.Printf("Processing campaign %s", campaign.ID)

	// Mark as sending
	err := MarkCampaignAsSending(campaign.ID)
	if err != nil {
		log.Printf("Error marking campaign %s as sending: %v", campaign.ID, err)
		return
	}

	// Get contacts
	contacts, err := GetCampaignContacts(campaign)
	if err != nil {
		log.Printf("Error fetching contacts for campaign %s: %v", campaign.ID, err)
		UpdateCampaignStatus(campaign.ID, "failed", CampaignStats{}) // Basic failure
		return
	}

	log.Printf("Campaign %s has %d recipients", campaign.ID, len(contacts))

	stats := CampaignStats{
		Total: len(contacts),
	}

	// Send messages
	// TODO: Implement concurrency/worker pool for faster sending if needed
	for _, contact := range contacts {
		err := SendCampaignMessage(campaign, contact)
		stats.Processed++
		
		if err != nil {
			log.Printf("Failed to send to %s: %v", contact.Telefone, err)
			stats.Failed++
		} else {
			stats.Sent++
		}

		// Update stats periodically (e.g. every 10 or at end)
		// For now, let's update every 10 to reduce DB load, or just at the end for simplicity?
		// Real-time feedback is nice.
		if stats.Processed%5 == 0 {
			UpdateCampaignStatus(campaign.ID, "sending", stats)
		}
		
		// Rate limiting (simple sleep)
		time.Sleep(500 * time.Millisecond) 
	}

	// Final update
	status := "completed"
	if stats.Sent == 0 && stats.Failed > 0 {
		status = "failed"
	}
	
	err = UpdateCampaignStatus(campaign.ID, status, stats)
	if err != nil {
		log.Printf("Error updating final status for campaign %s: %v", campaign.ID, err)
	}

	log.Printf("Finished campaign %s. Sent: %d, Failed: %d", campaign.ID, stats.Sent, stats.Failed)
}



