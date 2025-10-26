export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  time: number;
}

export interface Conversation {
  id: string;
  title: string;
  lastUpdated: number;
  messages: Message[];
}