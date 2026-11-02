import { ChatMessage, GeoLocation } from '@/lib/types';
import { SupportedLanguage } from '@/lib/i18n/types';

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  location: GeoLocation;
  language: SupportedLanguage;
  messages: ChatMessage[];
}

export type HistoryGrouping = 'today' | 'yesterday' | 'previous7Days' | 'older';

export interface GroupedConversations {
  today: Conversation[];
  yesterday: Conversation[];
  previous7Days: Conversation[];
  older: Conversation[];
}
