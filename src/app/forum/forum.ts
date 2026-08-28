import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ForumPost, Comment, UserProfile } from './forum.model';
import { ForumService } from './forum.service';

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forum.html',
  styleUrls: ['./forum.css']
})
export class ForumComponent implements OnInit {
  // Текущий пользователь
  currentUser = signal<UserProfile | null>({
    uid: 'user123',
    displayName: 'Алия Каримова',
    role: 'Студент-Магистрант',
    isProfileComplete: true
  });

  // Посты и состояния
  posts = signal<ForumPost[]>([]);
  newPostContent = signal<string>('');
  
  // Файл и статус загрузки
  selectedFile: File | null = null;
  isUploading = false;
  
  // Активные комментарии (ID поста -> текст комментария)
  commentInputs = signal<{ [postId: string]: string }>({});
  expandedComments = signal<{ [postId: string]: boolean }>({});

  constructor(
    private forumService: ForumService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.forumService.getPosts().subscribe(data => {
      this.posts.set(data);
    });
  }

  // Навигация на главную
  goBackToMainMenu(): void {
    this.router.navigate(['/login']);
  }

  // Выбор файла через input
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  // Создание поста с загрузкой картинки на ваш сервер
  async createPost(): Promise<void> {
    const user = this.currentUser();
    
    // Проверка доступа
    if (!user || !user.isProfileComplete) {
      alert('Чтобы публиковать материалы, необходимо заполнить профиль!');
      return;
    }

    if (!this.newPostContent().trim()) return;

    this.isUploading = true;
    let uploadedImageUrl = '';

    try {
      // 1. Загружаем файл на ваш Node.js сервер, если файл выбран
      if (this.selectedFile) {
        const formData = new FormData();
        formData.append('file', this.selectedFile);

        const response = await fetch('https://lessonstudy.asia/upload', {
          method: 'POST',
          body: formData
        });

        const data = await response.json();
        if (data.status === 'success') {
          uploadedImageUrl = data.url;
        }
      }

      // 2. Отправляем пост в Firestore
      const newPost: ForumPost = {
        authorName: user.displayName,
        authorRole: user.role,
        content: this.newPostContent(),
        imageUrl: uploadedImageUrl || undefined,
        createdAt: new Date(),
        commentsCount: 0,
        comments: []
      };

      await this.forumService.addPost(newPost);

      // 3. Очищаем форму
      this.newPostContent.set('');
      this.selectedFile = null;
      this.loadPosts();

    } catch (error) {
      console.error('Ошибка при создании поста:', error);
      alert('Не удалось загрузить изображение или опубликовать пост.');
    } finally {
      this.isUploading = false;
    }
  }

  // Переключение комментариев
  toggleComments(postId: string): void {
    this.expandedComments.update(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  }

  // Добавление комментария
  addComment(postId: string): void {
    const user = this.currentUser();
    const text = this.commentInputs()[postId];

    if (!user || !user.isProfileComplete) {
      alert('Комментирование доступно только пользователям с заполненным профилем.');
      return;
    }

    if (!text || !text.trim()) return;

    const comment: Comment = {
      id: Date.now().toString(),
      authorName: user.displayName,
      authorRole: user.role,
      text: text,
      createdAt: new Date()
    };

    this.forumService.addComment(postId, comment).then(() => {
      this.commentInputs.update(prev => ({ ...prev, [postId]: '' }));
      this.loadPosts();
    });
  }

  updateCommentInput(postId: string, value: string): void {
    this.commentInputs.update(prev => ({ ...prev, [postId]: value }));
  }
}