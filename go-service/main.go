package main

import (
	"log"
	"os"
	"path/filepath"
	"time"

	"github.com/joho/godotenv"
)

func main() {
	// Configure logging to show timestamp
	log.SetFlags(log.LstdFlags | log.Lmicroseconds)

	// Debug CWD
	cwd, _ := os.Getwd()
	log.Printf("📂 Current Working Directory: %s", cwd)

	// Load .env file
	// 1. Try local .env
	err := godotenv.Load()
	if err == nil {
		log.Println("✅ Loaded configuration from .env")
	} else {
		log.Printf("⚠️ Could not load local .env: %v", err)
		
		// 2. Try parent directory ../.env
		parentEnv := filepath.Join("..", ".env")
		log.Printf("🔄 Trying to load from: %s", parentEnv)
		
		err = godotenv.Load(parentEnv)
		if err != nil {
			log.Printf("⚠️ Could not load parent .env: %v", err)
			
			// 3. Try hardcoded relative path for debugging if needed
			if _, statErr := os.Stat(parentEnv); os.IsNotExist(statErr) {
				log.Printf("❌ File does not exist at path: %s", parentEnv)
				absPath, _ := filepath.Abs(parentEnv)
				log.Printf("❌ Absolute path looked for: %s", absPath)
			}
		} else {
			log.Println("✅ Loaded configuration from ../.env")
		}
	}

	// Initialize Database (Supabase Client)
	// This will log fatal if vars are missing
	InitDB()
	// No defer db.Close() needed for HTTP client

	log.Println("🚀 Starting Artemis Campaign Worker...")
	log.Println("⏳ Polling interval: 10 seconds")

	// Ticker for polling
	ticker := time.NewTicker(10 * time.Second)
	defer ticker.Stop()

	// Run immediately on start
	processCampaigns()

	for range ticker.C {
		processCampaigns()
	}
}

func processCampaigns() {
	log.Println("🔍 Polling for pending campaigns...")
	
	campaigns, err := GetPendingCampaigns()
	if err != nil {
		log.Printf("❌ Error fetching pending campaigns: %v", err)
		return
	}

	if len(campaigns) == 0 {
		return
	}

	log.Printf("📢 Found %d pending campaigns to process.", len(campaigns))

	for _, campaign := range campaigns {
		processSingleCampaign(campaign)
	}
}

func processSingleCampaign(campaign Campaign) {
	log.Printf("▶️ Starting processing for campaign ID: %s", campaign.ID)

	// Mark as sending/processing
	err := MarkCampaignAsSending(campaign.ID)
	if err != nil {
		log.Printf("❌ Critical Error marking campaign %s as sending: %v", campaign.ID, err)
		return
	}

	// Get contacts
	contacts, err := GetCampaignContacts(campaign)
	if err != nil {
		log.Printf("❌ Error fetching contacts for campaign %s: %v", campaign.ID, err)
		UpdateCampaignStatus(campaign.ID, "failed", CampaignStats{}) 
		return
	}

	if len(contacts) == 0 {
		log.Printf("⚠️ Campaign %s has 0 recipients. Marking as completed.", campaign.ID)
		UpdateCampaignStatus(campaign.ID, "completed", CampaignStats{Total: 0})
		return
	}

	log.Printf("📋 Campaign %s has %d recipients. Starting send loop...", campaign.ID, len(contacts))

	stats := CampaignStats{
		Total: len(contacts),
	}

	for i, contact := range contacts {
		// Check if campaign was paused or cancelled
		currentStatus, statusErr := GetCampaignStatus(campaign.ID)
		if statusErr != nil {
			log.Printf("⚠️ Error checking campaign status: %v", statusErr)
		} else if currentStatus == "paused" {
			log.Printf("⏸️ Campaign %s was paused. Stopping send loop.", campaign.ID)
			// Keep status as paused, update stats
			UpdateCampaignStatus(campaign.ID, "paused", stats)
			return
		} else if currentStatus == "cancelled" {
			log.Printf("🚫 Campaign %s was cancelled. Stopping send loop.", campaign.ID)
			// Status already set to cancelled by API, just update stats
			UpdateCampaignStatus(campaign.ID, "cancelled", stats)
			return
		}

		log.Printf("➡️ [%d/%d] Processing contact: %s (%s)", i+1, len(contacts), contact.Nome, contact.Telefone)
		
		err := SendCampaignMessage(campaign, contact)
		stats.Processed++
		
		if err != nil {
			log.Printf("❌ Failed to send to %s: %v", contact.Telefone, err)
			stats.Failed++
		} else {
			log.Printf("✅ Successfully sent to %s", contact.Telefone)
			stats.Sent++
		}

		if stats.Processed%5 == 0 {
			// Update stats but keep status as processing/sending
			UpdateCampaignStatus(campaign.ID, "sending", stats)
		}
		
		// Rate limiting
		time.Sleep(500 * time.Millisecond) 
	}

	// Final update
	status := "completed"
	if stats.Sent == 0 && stats.Failed > 0 {
		status = "failed"
	}
	
	log.Printf("🏁 Campaign %s finished. Status: %s. Stats: %+v", campaign.ID, status, stats)

	err = UpdateCampaignStatus(campaign.ID, status, stats)
	if err != nil {
		log.Printf("❌ Error updating final status for campaign %s: %v", campaign.ID, err)
	}
}
