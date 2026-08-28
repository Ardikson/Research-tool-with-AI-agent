export interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  avatarUrl?: string;
  text: string;
  createdAt: any;
}

export interface ForumPost {
  id?: string;
  authorName: string;
  authorRole: string; // например: "Преподаватель / Методист"
  avatarUrl?: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
  commentsCount: number;
  comments?: Comment[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  role: string; // Школа, должность или статус
  isProfileComplete: boolean; // Флаг заполненности профиля
}