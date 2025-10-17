export enum MessageType {
  Text = 'text',
  Image = 'image',
  System = 'system'
}

export interface Message {
  id: string;
  roomId: string;
  senderId: string;
  content: string | null;
  messageType: MessageType;
  isRead: boolean;
  createdAt: Date;
}
