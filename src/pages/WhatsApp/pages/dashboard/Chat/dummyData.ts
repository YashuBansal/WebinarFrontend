import type { ChatMessageDTO } from '@/api/modules/chatAPI';

export const DUMMY_CONTACTS = [
  {
    phoneNumber: "+1234567890",
    name: "John Doe",
    lastMessagePreview: "Hello! How can I help you today?",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    lastMessageStatus: "read",
    unreadCount: 2,
    timeRemaining: 1000 * 60 * 60 * 12, // 12 hours left
    lastMessageDirection: 'outbound',
  },
  {
    phoneNumber: "+1987654321",
    name: "Jane Smith",
    lastMessagePreview: "The template looks great!",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    lastMessageStatus: "delivered",
    unreadCount: 0,
    timeRemaining: 1000 * 60 * 60 * 20, // 20 hours left
    lastMessageDirection: 'outbound',
  },
  {
    phoneNumber: "+1555666777",
    name: "Business Lead",
    lastMessagePreview: "I'm interested in your services.",
    lastMessageAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(), // 25 hours ago (Expired)
    lastMessageStatus: "sent",
    unreadCount: 0,
    timeRemaining: 0, // Expired
    lastMessageDirection: 'inbound',
  }
] as const;

export const DUMMY_MESSAGES: ChatMessageDTO[] = [
  {
    _id: "m1",
    phoneNumber: "+1234567890",
    textBody: "Hi there!",
    direction: "inbound",
    createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    _id: "m2",
    phoneNumber: "+1234567890",
    textBody: "Hello! How can I help you today?",
    direction: "outbound",
    status: "read",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: "m3",
    phoneNumber: "+1987654321",
    textBody: "Can you send me the pricing?",
    direction: "inbound",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    _id: "m4",
    phoneNumber: "+1987654321",
    textBody: "Sure, here is our pricing template.",
    direction: "outbound",
    status: "delivered",
    messageFormat: "template",
    templateName: "pricing_info",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  }
];
