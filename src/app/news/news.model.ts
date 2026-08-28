export interface NewsItem {
  id?: string;
  title: string;
  content: string;
  imageUrl?: string;
  
  // Поля от n8n
  createdAt?: number;
  createdAtFormatted?: string;
  
  // Поля интерфейса (для совместимости)
  date?: string; 
  createdAtTimestamp?: number;
  
  author?: string;
  category?: string;
}