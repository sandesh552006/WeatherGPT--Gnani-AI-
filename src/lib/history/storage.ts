import { Conversation, GroupedConversations } from './types';
import { GeoLocation } from '@/lib/types';
import { SupportedLanguage } from '@/lib/i18n/types';

const STORAGE_KEY = 'weathergpt_conversations_v1';
const ACTIVE_CONV_KEY = 'weathergpt_active_conversation_id';

/**
 * Generate a short, deterministic, readable title locally from the first user message
 */
export function generateDeterministicTitle(message: string, fallbackLocation?: string): string {
  if (!message || message.trim().length === 0) {
    return fallbackLocation ? `${fallbackLocation} Weather` : 'New Weather Chat';
  }

  const raw = message.trim();

  // Pattern detection
  const lower = raw.toLowerCase();

  // Extract city if present
  let city = '';
  const cityMatch = raw.match(
    /\b(?:in|at|near|for|around)\s+([A-Za-z\u0900-\u097F]{2,25})/i
  );
  if (cityMatch?.[1]) {
    city = cityMatch[1].trim();
  }

  if (lower.includes('rain') || lower.includes('बारिश') || lower.includes('पाऊस') || lower.includes('umbrella') || lower.includes('छाता')) {
    if (lower.includes('tomorrow') || lower.includes('कल') || lower.includes('उद्या')) {
      return city ? `${city} Rain Tomorrow` : 'Rain Tomorrow';
    }
    return city ? `${city} Rain Forecast` : 'Rain & Umbrella Inquiry';
  }

  if (lower.includes('temp') || lower.includes('तापमान') || lower.includes('degrees') || lower.includes('hot') || lower.includes('cold')) {
    return city ? `${city} Temperature` : 'Temperature Trend';
  }

  if (lower.includes('wind') || lower.includes('हवा') || lower.includes('वारा') || lower.includes('breeze')) {
    return city ? `${city} Wind Speed` : 'Wind Conditions';
  }

  if (lower.includes('farm') || lower.includes('crop') || lower.includes('खेती') || lower.includes('शेत')) {
    return 'Farming Weather Advisory';
  }

  if (lower.includes('travel') || lower.includes('trip') || lower.includes('यात्रा')) {
    return city ? `Travel to ${city}` : 'Travel Weather Outlook';
  }

  if (lower.includes('tomorrow') || lower.includes('कल') || lower.includes('उद्या')) {
    return city ? `${city} Tomorrow` : 'Tomorrow Forecast';
  }

  if (lower.includes('tonight') || lower.includes('आज रात') || lower.includes('आज रात्री')) {
    return city ? `${city} Tonight` : 'Tonight Forecast';
  }

  // Fallback: truncate to first 4-5 words or 35 chars
  const words = raw.split(/\s+/).slice(0, 5).join(' ');
  const cleaned = words.replace(/[^\w\s\u0900-\u097F]/g, '').trim();
  if (cleaned.length > 0) {
    return cleaned.length > 32 ? cleaned.slice(0, 32) + '...' : cleaned;
  }

  return fallbackLocation ? `${fallbackLocation} Weather` : 'Weather Conversation';
}

/**
 * Safe deterministic deduplication and migration for conversations.
 * Merges duplicate entries that arose from split conversation IDs,
 * keeping the entry with the most complete message history and newest timestamp.
 */
export function deduplicateAndMigrateConversations(conversations: Conversation[]): Conversation[] {
  if (!Array.isArray(conversations) || conversations.length === 0) return [];

  const deduped: Conversation[] = [];
  const idMap = new Map<string, Conversation>();

  for (const conv of conversations) {
    if (!conv || !conv.id) continue;

    // Normalize messages array
    const msgs = Array.isArray(conv.messages) ? conv.messages : [];
    const validConv: Conversation = {
      ...conv,
      messages: msgs,
      createdAt: conv.createdAt || Date.now(),
      updatedAt: conv.updatedAt || conv.createdAt || Date.now(),
    };

    // 1. Check if an entry with the exact same ID already exists
    if (idMap.has(validConv.id)) {
      const existing = idMap.get(validConv.id)!;
      if (validConv.messages.length > existing.messages.length) {
        idMap.set(validConv.id, validConv);
      }
      continue;
    }

    // 2. Check for duplicate conversations created with different IDs
    // (same location name and identical first user message or message prefix within a 30-minute window)
    let merged = false;
    for (const [existingId, existing] of Array.from(idMap.entries())) {
      const sameLocation =
        existing.location?.name?.toLowerCase().trim() ===
        validConv.location?.name?.toLowerCase().trim();

      const existingFirstMsg = existing.messages[0]?.content?.trim() || '';
      const convFirstMsg = validConv.messages[0]?.content?.trim() || '';

      const sameFirstMessage =
        existingFirstMsg.length > 0 &&
        convFirstMsg.length > 0 &&
        existingFirstMsg === convFirstMsg;

      const closeInTime = Math.abs(existing.createdAt - validConv.createdAt) < 30 * 60 * 1000;

      if (sameLocation && sameFirstMessage && closeInTime) {
        // True duplicate found! Merge safely.
        merged = true;

        // Choose the one with more messages as base
        const primary =
          validConv.messages.length >= existing.messages.length ? validConv : existing;
        const secondary = primary === validConv ? existing : validConv;

        // Combine any unique messages by ID
        const existingMsgIds = new Set(primary.messages.map((m: any) => m.id));
        const combinedMsgs = [...primary.messages];
        for (const m of secondary.messages) {
          if (!existingMsgIds.has(m.id)) {
            combinedMsgs.push(m);
            existingMsgIds.add(m.id);
          }
        }

        const mergedConv: Conversation = {
          ...primary,
          messages: combinedMsgs,
          updatedAt: Math.max(primary.updatedAt, secondary.updatedAt),
        };

        idMap.delete(existingId);
        idMap.set(mergedConv.id, mergedConv);

        // If the active conversation in localStorage pointed to the merged-away ID, re-point it
        if (typeof window !== 'undefined') {
          const activeId = localStorage.getItem(ACTIVE_CONV_KEY);
          if (activeId === secondary.id) {
            localStorage.setItem(ACTIVE_CONV_KEY, mergedConv.id);
          }
        }
        break;
      }
    }

    if (!merged) {
      idMap.set(validConv.id, validConv);
    }
  }

  return Array.from(idMap.values()).sort((a, b) => b.updatedAt - a.updatedAt);
}

/**
 * Load all saved conversations from localStorage with safe deduplication
 */
export function loadConversations(): Conversation[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      const deduped = deduplicateAndMigrateConversations(parsed);
      // If deduplication removed any duplicate records, persist the clean array
      if (deduped.length !== parsed.length) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
      }
      return deduped;
    }
  } catch (err) {
    console.warn('Failed to load chat history from localStorage:', err);
  }
  return [];
}

/**
 * Save or update a conversation in localStorage
 */
export function saveConversation(conversation: Conversation): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadConversations();
    const index = existing.findIndex((c) => c.id === conversation.id);

    const updatedConv: Conversation = {
      ...conversation,
      updatedAt: Date.now(),
    };

    if (index >= 0) {
      existing[index] = updatedConv;
    } else {
      existing.unshift(updatedConv);
    }

    // Run deduplication to guarantee no duplicates ever exist in storage
    const cleanList = deduplicateAndMigrateConversations(existing);
    const trimmed = cleanList.slice(0, 50);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn('Failed to save conversation to localStorage:', err);
  }
}

/**
 * Delete a specific conversation by ID
 */
export function deleteConversation(id: string): void {
  if (typeof window === 'undefined') return;
  try {
    const existing = loadConversations();
    const filtered = existing.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    const activeId = getActiveConversationId();
    if (activeId === id) {
      setActiveConversationId(null);
    }
  } catch (err) {
    console.warn('Failed to delete conversation from localStorage:', err);
  }
}

/**
 * Clear all conversation history
 */
export function clearAllConversations(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_CONV_KEY);
  } catch (err) {
    console.warn('Failed to clear conversations from localStorage:', err);
  }
}

/**
 * Get the currently active conversation ID
 */
export function getActiveConversationId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(ACTIVE_CONV_KEY);
  } catch {
    return null;
  }
}

/**
 * Set the currently active conversation ID
 */
export function setActiveConversationId(id: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CONV_KEY, id);
    } else {
      localStorage.removeItem(ACTIVE_CONV_KEY);
    }
  } catch {}
}

/**
 * Group conversations chronologically (Today, Yesterday, Previous 7 Days, Older)
 */
export function groupConversationsChronologically(conversations: Conversation[]): GroupedConversations {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const grouped: GroupedConversations = {
    today: [],
    yesterday: [],
    previous7Days: [],
    older: [],
  };

  for (const c of conversations) {
    const time = c.updatedAt || c.createdAt;
    if (time >= todayStart) {
      grouped.today.push(c);
    } else if (time >= yesterdayStart) {
      grouped.yesterday.push(c);
    } else if (time >= sevenDaysAgoStart) {
      grouped.previous7Days.push(c);
    } else {
      grouped.older.push(c);
    }
  }

  return grouped;
}

/**
 * Local search across conversation titles, messages, and location names
 */
export function searchLocalConversations(
  conversations: Conversation[],
  query: string
): Conversation[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) return conversations;

  return conversations.filter((c) => {
    if (c.title.toLowerCase().includes(trimmed)) return true;
    if (c.location.name.toLowerCase().includes(trimmed)) return true;
    if (c.location.country.toLowerCase().includes(trimmed)) return true;

    // Search message contents
    const hasMatchingMsg = c.messages.some((m) =>
      m.content.toLowerCase().includes(trimmed)
    );
    if (hasMatchingMsg) return true;

    return false;
  });
}
