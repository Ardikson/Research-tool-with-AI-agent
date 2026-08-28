import { Injectable } from '@angular/core';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  doc, 
  updateDoc, 
  arrayUnion, 
  onSnapshot 
} from 'firebase/firestore';
import { Observable } from 'rxjs';
import { ForumPost, Comment } from './forum.model';

@Injectable({
  providedIn: 'root'
})
export class ForumService {
  private db = getFirestore();

  // Получить список постов в реальном времени
  getPosts(): Observable<ForumPost[]> {
    return new Observable(subscriber => {
      const postsRef = collection(this.db, 'forum_posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const posts: ForumPost[] = snapshot.docs.map(docSnapshot => ({
          id: docSnapshot.id,
          ...docSnapshot.data()
        } as ForumPost));
        
        subscriber.next(posts);
      }, (error) => {
        subscriber.error(error);
      });

      return () => unsubscribe();
    });
  }

  // Добавить новый пост
  async addPost(post: ForumPost): Promise<void> {
    const postsRef = collection(this.db, 'forum_posts');
    await addDoc(postsRef, {
      ...post,
      createdAt: new Date()
    });
  }

  // Добавить комментарий к посту
  async addComment(postId: string, comment: Comment): Promise<void> {
    const postDocRef = doc(this.db, 'forum_posts', postId);
    await updateDoc(postDocRef, {
      comments: arrayUnion(comment)
    });
  }
}