package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// SendCampaignMessage determines whether to send text or media
func SendCampaignMessage(campaign Campaign, contact Contact) error {
	var instanceID string
	if campaign.InboxID != nil {
		instanceID = *campaign.InboxID
	}
	
	if instanceID == "" {
		return fmt.Errorf("inbox ID (instance) is missing")
	}

	phone := cleanPhone(contact.Telefone)
	
	// Replace variables in message text (e.g. {{nome}})
	var messageText string
	if campaign.MessageText != nil {
		messageText = *campaign.MessageText
	}
	
	messageText = strings.ReplaceAll(messageText, "{{nome}}", contact.Nome)
	
	if contact.Sobrenome != nil {
		messageText = strings.ReplaceAll(messageText, "{{sobrenome}}", *contact.Sobrenome)
	} else {
		messageText = strings.ReplaceAll(messageText, "{{sobrenome}}", "")
	}

	log.Printf("📨 Preparing message for %s (Instance: %s)", phone, instanceID)

	// Determine if media
	if campaign.AttachmentURL != nil && *campaign.AttachmentURL != "" {
		attachmentType := "document"
		if campaign.AttachmentType != nil {
			attachmentType = *campaign.AttachmentType
		}
		log.Printf("📎 Message has attachment: %s (%s)", *campaign.AttachmentURL, attachmentType)
		return sendMedia(instanceID, phone, *campaign.AttachmentURL, attachmentType, messageText)
	}

	// Text only
	if messageText != "" {
		return sendText(instanceID, phone, messageText)
	}

	return fmt.Errorf("empty message and no attachment")
}

func sendText(instanceID, phone, text string) error {
	payload := EvolutionTextMessage{
		Number: phone,
		Text:   text,
	}
	
	return makeRequest(instanceID, "send/text", payload)
}

func sendMedia(instanceID, phone, url, mediaType, caption string) error {
	typeStr := "document"
	if strings.HasPrefix(mediaType, "image") {
		typeStr = "image"
	} else if strings.HasPrefix(mediaType, "video") {
		typeStr = "video"
	} else if strings.HasPrefix(mediaType, "audio") {
		typeStr = "audio"
	}

	payload := EvolutionMediaMessage{
		Number:   phone,
		Type:     typeStr,
		URL:      url,
		Caption:  caption,
		MimeType: mediaType,
	}

	return makeRequest(instanceID, "send/media", payload)
}

func makeRequest(instanceID, endpoint string, payload interface{}) error {
	apiURL := os.Getenv("EVOLUTION_API_URL")
	apiKey := os.Getenv("EVOLUTION_API_KEY")

	if apiURL == "" || apiKey == "" {
		return fmt.Errorf("EVOLUTION_API_URL or EVOLUTION_API_KEY not set")
	}

	apiURL = strings.TrimSuffix(apiURL, "/")

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/%s", apiURL, endpoint)
	
	// Logging Request
	log.Printf("🚀 API Request: POST %s", url)
	log.Printf("📦 Payload: %s", string(jsonData))

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", instanceID)

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("❌ Network Error: %v", err)
		return err
	}
	defer resp.Body.Close()

	bodyBytes, _ := io.ReadAll(resp.Body)
	log.Printf("📥 API Response Status: %d %s", resp.StatusCode, resp.Status)
	
	if len(bodyBytes) > 0 {
		log.Printf("📄 API Response Body: %s", string(bodyBytes))
	}

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	log.Println("✅ Message sent successfully via API")
	return nil
}

func cleanPhone(phone string) string {
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, phone)
}
