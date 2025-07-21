# VisionStock Chatbot System — Standalone Guide

## Overview

The VisionStock Chatbot ("Bruce") is an AI-powered assistant for natural language image search, fully integrated into the VisionStock platform. It offers rich admin customization, secure access controls, and a modern, responsive user interface.

---

## 1. Features

- **Conversational Image Search:** Users describe what they want; the chatbot translates queries into structured searches.
- **Context Awareness:** Remembers conversation context for follow-up questions.
- **Image Results in Chat:** Results shown as clickable thumbnails.
- **Admin Customization:** Personalize avatar, personality, and welcome message.
- **Security:** Admin-only access for settings.
- **Responsive Design:** Seamless desktop and mobile experience.

---

## 2. Component Architecture

- **ChatBot.js:** Main chat interface, message display, user input, and settings integration.
- **ChatSettings.js:** Admin-only modal for avatar, personality, and welcome message.
- **ChatMessage.js:** Renders messages (text, images, metadata).
- **ChatInput.js:** Handles message composition and submission.
- **ChatHistory.js:** Maintains conversation log.
- **Hooks:** `useChat` and `useChatSettings` manage state and settings.

---

## 3. Admin Customization

### Access Control

- Only authenticated admins can access/modify chatbot settings.
- Settings icon (⚙️) is visible only to admins.

### Customization Options

- **Avatar:** Upload JPG/PNG/SVG (max 2MB, 512x512px recommended) with live preview.
- **Personality:** Choose from five presets or enter up to 1000 chars of custom instructions.
- **Welcome Message:** Set a personalized greeting with live preview.

### Security

- Admin login required (configurable via environment variables).
- Secure token-based sessions, input validation, and rate-limiting.

---

## 4. User Experience

- **Floating Chat Button:** Launch from anywhere in the admin dashboard.
- **Responsive Layout:** Modal on desktop, full-screen on mobile.
- **Accessibility:** ARIA labels, keyboard navigation, screen reader support.

---

## 5. How to Use

### For Users

1. Click the floating chat button.
2. Type a query (e.g., "Show me images of tractors in the field").
3. Browse results as thumbnails.
4. Click an image for tag-based search or details.

### For Admins

1. Log in with admin credentials.
2. Open chatbot, click the ⚙️ icon.
3. Use the 3-tab interface to:
   - Upload/change avatar.
   - Select/customize personality.
   - Edit welcome message.
4. Save changes; updates are instant.

---

## 6. Security & Privacy

- All chat data is sanitized before display.
- Admin settings stored securely (database, with localStorage fallback).
- Sensitive operations require valid admin session.

---

## 7. Troubleshooting

- **Settings not saving?** Ensure admin login and input requirements are met.
- **Bot not responding?** Check API connectivity/authentication.
- **UI issues?** Clear browser cache or use a supported browser.

---

## 8. Extending the Chatbot

- **Add personalities:** Update presets in `ChatSettings.js`.
- **Change theme:** Modify Material-UI theme provider.
- **Integrate new AI models:** Update backend API for new models/providers.

---

## 9. Visual Reference

![Chatbot UI Example](ai-profiles-page.png)

---

## 10. Further Reading

- [Chatbot Implementation Details](features/CHATBOT_IMPLEMENTATION.md)
- [Chat Settings Guide](features/CHAT_SETTINGS_GUIDE.md)
- [AI Profile System Overview](architecture/AI_AUTO_PROFILE_SYSTEM_SPEC.md)

---

For questions or feature requests, contact the VisionStock development team.
