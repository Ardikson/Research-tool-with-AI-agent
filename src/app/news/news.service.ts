import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { NewsItem } from './news.model';

// Конфиг Firebase (такой же, как в твое AuthService)
const firebaseConfig = {
  apiKey: "AIzaSyBr-wqy0onSA0PKRVy99fIgWK_ztaFoX8Y",
  authDomain: "lesson-study-2998e.firebaseapp.com",
  projectId: "lesson-study-2998e",
  storageBucket: "lesson-study-2998e.firebasestorage.app",
  messagingSenderId: "796469251360",
  appId: "1:796469251360:web:777cd0aac27ddbcda75b45",
  measurementId: "G-JQN4JZWDDZ"
};

@Injectable({
  providedIn: 'root'
})
export class NewsService {
  private app = initializeApp(firebaseConfig);
  private db = getFirestore(this.app);

  /**
   * Подписка на коллекцию 'news' в режиме реального времени.
   * Как только n8n создаст запись в Firestore, подписка сработает автоматически.
   */
  getNewsLive(): Observable<NewsItem[]> {
    return new Observable((observer) => {
      const newsCollection = collection(this.db, 'news');
      const q = query(newsCollection);

      const unsubscribe = onSnapshot(
        q, 
        (snapshot) => {
          const newsList: NewsItem[] = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<NewsItem, 'id'>)
          }));
          observer.next(newsList);
        }, 
        (error) => {
          console.error('Ошибка при получении новостей:', error);
          observer.error(error);
        }
      );

      return () => unsubscribe();
    });
  }
}