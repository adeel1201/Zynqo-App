export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  verified?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
}

export interface Chat {
  id: string;
  participants: User[];
  lastMessage: Message;
  unreadCount: number;
}

export interface Moment {
  id: string;
  userId: string;
  user: User;
  content: string;
  media?: string[];
  likes: number;
  comments: number;
  timestamp: string;
}

export interface StatusStory {
  id: string;
  userId: string;
  user: User;
  media: string;
  type: 'image' | 'video' | 'text';
  timestamp: string;
  hasSeen: boolean;
}

export const MOCK_CURRENT_USER: User = {
  id: 'me',
  username: 'alex_zynqo',
  displayName: 'Alex Rivers',
  avatar: 'https://picsum.photos/seed/42/100/100',
  status: 'online',
};

export const MOCK_USERS: User[] = [
  { id: '1', username: 'sarah_m', displayName: 'Sarah Miller', avatar: 'https://picsum.photos/seed/1/100/100', status: 'online', verified: true },
  { id: '2', username: 'j_doe', displayName: 'John Doe', avatar: 'https://picsum.photos/seed/2/100/100', status: 'offline', lastSeen: '2h ago' },
  { id: '3', username: 'elena_v', displayName: 'Elena Volkov', avatar: 'https://picsum.photos/seed/3/100/100', status: 'online' },
  { id: '4', username: 'mike_t', displayName: 'Mike Tech', avatar: 'https://picsum.photos/seed/4/100/100', status: 'away' },
];

export const MOCK_CHATS: Chat[] = [
  {
    id: 'c1',
    participants: [MOCK_USERS[0]],
    lastMessage: { id: 'm1', senderId: '1', text: 'Hey, are we still meeting today?', timestamp: '10:45 AM', status: 'read' },
    unreadCount: 2,
  },
  {
    id: 'c2',
    participants: [MOCK_USERS[1]],
    lastMessage: { id: 'm2', senderId: 'me', text: 'Sent the documents!', timestamp: 'Yesterday', status: 'delivered' },
    unreadCount: 0,
  },
  {
    id: 'c3',
    participants: [MOCK_USERS[2]],
    lastMessage: { id: 'm3', senderId: '3', text: 'That moment was incredible!', timestamp: 'Monday', status: 'read' },
    unreadCount: 0,
  },
];

export const MOCK_MOMENTS: Moment[] = [
  {
    id: 'mom1',
    userId: '1',
    user: MOCK_USERS[0],
    content: 'Loving the tech vibes in Neo Tokyo today! ⚡️ #future #vibes',
    media: ['https://picsum.photos/seed/99/600/400'],
    likes: 128,
    comments: 12,
    timestamp: '2h ago',
  },
  {
    id: 'mom2',
    userId: '3',
    user: MOCK_USERS[2],
    content: 'Just finished my latest design sprint. What do you think about the amethyst palette?',
    likes: 45,
    comments: 3,
    timestamp: '5h ago',
  },
];

export const MOCK_STORIES: StatusStory[] = [
  { id: 's1', userId: '1', user: MOCK_USERS[0], media: 'https://picsum.photos/seed/s1/400/600', type: 'image', timestamp: '30m ago', hasSeen: false },
  { id: 's2', userId: '2', user: MOCK_USERS[1], media: 'https://picsum.photos/seed/s2/400/600', type: 'image', timestamp: '1h ago', hasSeen: true },
  { id: 's3', userId: '3', user: MOCK_USERS[2], media: 'Working on something big...', type: 'text', timestamp: '4h ago', hasSeen: false },
];