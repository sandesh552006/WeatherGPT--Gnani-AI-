import { SupabaseClient } from '@supabase/supabase-js';
import { Conversation } from './types';
import { ChatMessage, GeoLocation } from '@/lib/types';
import { SupportedLanguage } from '@/lib/i18n/types';

const LEGACY_STORAGE_KEY = 'weathergpt_conversations_v1';
const USER_ACTIVE_CONV_PREFIX = 'weathergpt_active_conv_';
const MIGRATION_MARKER_PREFIX = 'weathergpt_history_migrated_v1_';
const LEGACY_OWNER_KEY = 'weathergpt_legacy_owner_id';

/**
 * Load all conversations for the authenticated user from Supabase.
 * Enforces user_id filtering alongside Supabase RLS.
 */
export async function loadUserConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<Conversation[]> {
  if (!supabase || !userId) return [];

  try {
    // 1. Fetch conversations for authenticated user ordered by updated_at DESC
    const { data: convRows, error: convError } = await supabase
      .from('conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });

    if (convError) {
      console.error('Error loading conversations from Supabase:', convError.message);
      return [];
    }

    if (!convRows || convRows.length === 0) {
      return [];
    }

    // 2. Fetch all messages for authenticated user ordered by created_at ASC
    const { data: msgRows, error: msgError } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (msgError) {
      console.warn('Warning loading messages from Supabase:', msgError.message);
    }

    // 3. Group messages by conversation_id
    const messagesByConvId = new Map<string, ChatMessage[]>();
    for (const m of msgRows || []) {
      const chatMsg: ChatMessage = {
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content || '',
        summaryCard: m.summary_card || undefined,
        followUps: Array.isArray(m.follow_ups) ? m.follow_ups : undefined,
        timestamp: m.created_at
          ? new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      const list = messagesByConvId.get(m.conversation_id) || [];
      list.push(chatMsg);
      messagesByConvId.set(m.conversation_id, list);
    }

    // 4. Reconstruct Conversation[] maintaining original application types
    const conversations: Conversation[] = convRows.map((c) => ({
      id: c.id,
      title: c.title || 'Weather Conversation',
      createdAt: c.created_at ? new Date(c.created_at).getTime() : Date.now(),
      updatedAt: c.updated_at ? new Date(c.updated_at).getTime() : Date.now(),
      location: (c.location as GeoLocation) || {
        name: 'India',
        latitude: 20.5937,
        longitude: 78.9629,
        country: 'India',
      },
      language: (c.language || 'en') as SupportedLanguage,
      messages: messagesByConvId.get(c.id) || [],
    }));

    return conversations;
  } catch (err: any) {
    console.error('Unexpected error loading user conversations:', err?.message || err);
    return [];
  }
}

/**
 * Save or update a conversation and insert only genuinely new messages into Supabase.
 * Uses auth.uid() / authenticated user.id strictly.
 */
export async function saveUserConversation(
  supabase: SupabaseClient,
  userId: string,
  conv: Conversation,
  newMessages: ChatMessage[] = []
): Promise<boolean> {
  if (!supabase || !userId || !conv || !conv.id) return false;

  try {
    // 1. Upsert conversation record
    const convRow = {
      id: conv.id,
      user_id: userId,
      title: conv.title,
      location: conv.location,
      language: conv.language,
      created_at: new Date(conv.createdAt).toISOString(),
      updated_at: new Date(conv.updatedAt).toISOString(),
    };

    const { error: convErr } = await supabase
      .from('conversations')
      .upsert(convRow, { onConflict: 'id' });

    if (convErr) {
      console.error('Failed to save conversation to Supabase:', convErr.message);
      return false;
    }

    // 2. Insert only NEW messages to avoid duplicate rows
    if (newMessages.length > 0) {
      const baseTime = Date.now();
      const msgRows = newMessages.map((m, idx) => ({
        id: m.id,
        conversation_id: conv.id,
        user_id: userId,
        role: m.role,
        content: m.content || '',
        summary_card: m.summaryCard || null,
        follow_ups: m.followUps || null,
        created_at: new Date(baseTime + idx * 10).toISOString(),
      }));

      const { error: msgErr } = await supabase
        .from('messages')
        .upsert(msgRows, { onConflict: 'id' });

      if (msgErr) {
        console.error('Failed to save messages to Supabase:', msgErr.message);
        return false;
      }
    }

    return true;
  } catch (err: any) {
    console.error('Unexpected error in saveUserConversation:', err?.message || err);
    return false;
  }
}

/**
 * Delete a specific conversation by ID for the authenticated user.
 * Messages are removed automatically via ON DELETE CASCADE.
 */
export async function deleteUserConversation(
  supabase: SupabaseClient,
  userId: string,
  convId: string
): Promise<boolean> {
  if (!supabase || !userId || !convId) return false;

  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('id', convId)
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to delete conversation from Supabase:', error.message);
      return false;
    }

    // Clean up active conversation pointer if it matched deleted conversation
    if (getUserActiveConversationId(userId) === convId) {
      setUserActiveConversationId(userId, null);
    }

    return true;
  } catch (err: any) {
    console.error('Unexpected error in deleteUserConversation:', err?.message || err);
    return false;
  }
}

/**
 * Clear all conversations for the authenticated user from Supabase.
 * Strictly scoped to user_id = user.id.
 */
export async function clearAllUserConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (!supabase || !userId) return false;

  try {
    const { error } = await supabase
      .from('conversations')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Failed to clear user conversations from Supabase:', error.message);
      return false;
    }

    setUserActiveConversationId(userId, null);
    return true;
  } catch (err: any) {
    console.error('Unexpected error in clearAllUserConversations:', err?.message || err);
    return false;
  }
}

/**
 * Get the active conversation ID for the specific user
 */
export function getUserActiveConversationId(userId: string): string | null {
  if (typeof window === 'undefined' || !userId) return null;
  try {
    return localStorage.getItem(`${USER_ACTIVE_CONV_PREFIX}${userId}`);
  } catch {
    return null;
  }
}

/**
 * Set the active conversation ID for the specific user
 */
export function setUserActiveConversationId(userId: string, convId: string | null): void {
  if (typeof window === 'undefined' || !userId) return;
  try {
    if (convId) {
      localStorage.setItem(`${USER_ACTIVE_CONV_PREFIX}${userId}`, convId);
    } else {
      localStorage.removeItem(`${USER_ACTIVE_CONV_PREFIX}${userId}`);
    }
  } catch {}
}

/**
 * Safely migrate legacy localStorage data:
 * - Only migrates if the current user explicitly owns or established ownership of the device's legacy data.
 * - NEVER automatically assigns unverified global legacy data to another user.
 * - Only removes legacy localStorage data AFTER a fully verified successful Supabase migration.
 * - Preserves legacy data if ownership is ambiguous or migration fails.
 */
export async function migrateLegacyLocalStorageIfOwned(
  supabase: SupabaseClient,
  userId: string
): Promise<boolean> {
  if (typeof window === 'undefined' || !supabase || !userId) return false;

  const migrationKey = `${MIGRATION_MARKER_PREFIX}${userId}`;
  try {
    // Check if already migrated for this user
    if (localStorage.getItem(migrationKey) === 'true') {
      return false;
    }

    // Check if legacy data exists
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(migrationKey, 'true');
      return false;
    }

    const legacyConvs = JSON.parse(raw);
    if (!Array.isArray(legacyConvs) || legacyConvs.length === 0) {
      localStorage.setItem(migrationKey, 'true');
      return false;
    }

    // Ownership check:
    // If another user has already been recorded as the legacy owner on this device, do NOT migrate to this user!
    const existingOwner = localStorage.getItem(LEGACY_OWNER_KEY);
    if (existingOwner && existingOwner !== userId) {
      console.warn('Legacy localStorage history belongs to a different user session. Preserving without cross-user assignment.');
      return false;
    }

    // Register ownership of legacy history on this device for the current user
    if (!existingOwner) {
      localStorage.setItem(LEGACY_OWNER_KEY, userId);
    }

    // Migrate each conversation and its messages into Supabase
    for (const conv of legacyConvs) {
      if (!conv || !conv.id) continue;

      const convRow = {
        id: conv.id,
        user_id: userId,
        title: conv.title || 'Weather Conversation',
        location: conv.location,
        language: conv.language || 'en',
        created_at: conv.createdAt ? new Date(conv.createdAt).toISOString() : new Date().toISOString(),
        updated_at: conv.updatedAt ? new Date(conv.updatedAt).toISOString() : new Date().toISOString(),
      };

      const { error: convErr } = await supabase
        .from('conversations')
        .upsert(convRow, { onConflict: 'id' });

      if (convErr) {
        throw new Error(`Failed to migrate conversation ${conv.id}: ${convErr.message}`);
      }

      const msgs = Array.isArray(conv.messages) ? conv.messages : [];
      if (msgs.length > 0) {
        const baseMsgTime = conv.createdAt || Date.now();
        const msgRows = msgs.map((m: any, idx: number) => ({
          id: m.id || `${conv.id}_msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          conversation_id: conv.id,
          user_id: userId,
          role: m.role || 'user',
          content: m.content || '',
          summary_card: m.summaryCard || null,
          follow_ups: m.followUps || null,
          created_at: new Date(baseMsgTime + idx * 1000).toISOString(),
        }));

        const { error: msgErr } = await supabase
          .from('messages')
          .upsert(msgRows, { onConflict: 'id' });

        if (msgErr) {
          throw new Error(`Failed to migrate messages for conversation ${conv.id}: ${msgErr.message}`);
        }
      }
    }

    // Migration succeeded! Mark as complete and safely remove legacy global storage
    localStorage.setItem(migrationKey, 'true');
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    console.info('Legacy chat history successfully migrated to Supabase for user:', userId);
    return true;
  } catch (err: any) {
    console.warn('Legacy chat history migration postponed or failed:', err?.message || err);
    // Legacy storage is safely preserved on error
    return false;
  }
}
