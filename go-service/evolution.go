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

	// Process Attachments (JSONB array)
	var attachments []Attachment
	if len(campaign.Attachments) > 0 {
		if err := json.Unmarshal(campaign.Attachments, &attachments); err != nil {
			log.Printf("⚠️ Failed to unmarshal attachments: %v", err)
		}
	}

	// Legacy fallback: if no JSONB attachments but AttachmentURL exists
	if len(attachments) == 0 && campaign.AttachmentURL != nil && *campaign.AttachmentURL != "" {
		attachmentType := "document"
		if campaign.AttachmentType != nil {
			attachmentType = *campaign.AttachmentType
		}
		attachments = append(attachments, Attachment{
			URL:     *campaign.AttachmentURL,
			Type:    attachmentType,
			Caption: "",
		})
	}

	// Send Attachments
	for i, att := range attachments {
		if att.URL == "" {
			continue
		}
		
		// Use provided type or guess default
		attachmentType := att.Type
		if attachmentType == "" {
			attachmentType = "document"
		}

		log.Printf("📎 Sending attachment %d/%d: %s (%s)", i+1, len(attachments), att.URL, attachmentType)
		
		err := sendMedia(instanceID, phone, att.URL, attachmentType, att.Caption)
		if err != nil {
			log.Printf("❌ Failed to send attachment %d: %v", i+1, err)
			// Decide if we should return error or try sending text anyway.
			// Returning error here might be safer to flag incomplete delivery.
			return fmt.Errorf("failed to send attachment %d: %w", i+1, err)
		}
		
		// Rate limiting between messages
		time.Sleep(500 * time.Millisecond)
	}

	// Text only
	if messageText != "" {
		log.Printf("📝 Sending text message part")
		return sendText(instanceID, phone, messageText)
	}

	// If we sent media but had no text, that's success.
	if len(attachments) > 0 {
		return nil
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
