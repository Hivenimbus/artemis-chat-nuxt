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
	instanceID := campaign.InboxID.String
	if instanceID == "" {
		return fmt.Errorf("inbox ID (instance) is missing")
	}

	phone := cleanPhone(contact.Telefone)
	
	// Replace variables in message text (e.g. {{nome}})
	messageText := campaign.MessageText.String
	messageText = strings.ReplaceAll(messageText, "{{nome}}", contact.Nome)
	if contact.Sobrenome.Valid {
		messageText = strings.ReplaceAll(messageText, "{{sobrenome}}", contact.Sobrenome.String)
	} else {
		messageText = strings.ReplaceAll(messageText, "{{sobrenome}}", "")
	}
	// Add other replacements as needed

	// Determine if media
	if campaign.AttachmentURL.Valid && campaign.AttachmentURL.String != "" {
		return sendMedia(instanceID, phone, campaign.AttachmentURL.String, campaign.AttachmentType.String, messageText)
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
	// Evolution API types: image, video, audio, document
	// mediaType from DB might need mapping if it's full MIME type
	
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
		MimeType: mediaType, // Optional but good for documents
	}

	// Use generic media endpoint
	return makeRequest(instanceID, "send/media", payload)
}

func makeRequest(instanceID, endpoint string, payload interface{}) error {
	apiURL := os.Getenv("EVOLUTION_API_URL")
	apiKey := os.Getenv("EVOLUTION_API_KEY")

	if apiURL == "" || apiKey == "" {
		return fmt.Errorf("EVOLUTION_API_URL or EVOLUTION_API_KEY not set")
	}

	// Remove trailing slash from URL
	apiURL = strings.TrimSuffix(apiURL, "/")

	jsonData, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	url := fmt.Sprintf("%s/%s", apiURL, endpoint)
	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonData))
	if err != nil {
		return err
	}

	// Use instanceID as apikey header (Evolution v2 pattern often uses global key or instance key)
	// Based on Nuxt code: 'apikey': instanceId
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", instanceID)
	// Some setups might need global API key as well, but Nuxt code uses instanceId as apikey header.
	// If Global API Key is needed for authentication to the manager, it might be different.
	// Looking at Nuxt code: 'apikey': instanceId. 
	// But `findEvolutionInstanceId` uses `config.evolutionApiKey` in header 'apikey' to fetch instances.
	// `sendTextMessageToWhatsApp` uses `instanceId` in header 'apikey'.
	// So we follow Nuxt pattern.

	client := &http.Client{Timeout: 30 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		bodyBytes, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	return nil
}

func cleanPhone(phone string) string {
	// Remove non-digits
	return strings.Map(func(r rune) rune {
		if r >= '0' && r <= '9' {
			return r
		}
		return -1
	}, phone)
}



