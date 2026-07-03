import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Comment {
  id: number;
  author: string;
  text: string;
}

interface Post {
  id: number;
  author: string;
  avatar: string;
  date: string;
  text: string;
  image?: string;
  comments: Comment[];
}

@Component({
  selector: 'app-forum',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './forum.html',
  styleUrl: './forum.css'
})
export class ForumComponent {

  // Реактивные сигналы для полей создания поста
  newPostText = signal('');
  newPostImage = signal('');

  // Переменная для отслеживания развернутых комментариев (хранит ID открытого поста)
  expandedPostId = signal<number | null>(null);

  // Стартовая лента блогов
  posts = signal<Post[]>([
    {
      id: 1,
      author: 'Алия Каримова (Студент-Магистрант)',
      avatar: '👩‍🎓',
      date: 'Сегодня, 10:15',
      text: 'Провели сегодня 1-й исследовательский урок в рамках нашего цикла Lesson Study во 2-м классе лицея №134. Наш фокусный ученик С (испытывающий трудности в концентрации) на удивление активно включился в работу в паре! Использование визуальных карточек на этапе рефлексии дало отличный результат. Делюсь фотографией нашего рабочего флипчарта после обсуждения группой.',
      image: 'https://images.unsplash.com/photo-1544535830-9dff9e0d4bee?auto=format&fit=crop&w=800&q=80',
      comments: [
        { id: 1, author: 'Нурлан С.', text: 'Отличный результат! А как долго длилась работа в парах?' },
        { id: 2, author: 'Алия Каримова', text: 'Спасибо! Выделили ровно 7 минут, дольше они бы не удержали фокус.' }
      ]
    },
    {
      id: 2,
      author: 'Данияр Жумабеков (Преподаватель / Методист)',
      avatar: '👨‍🏫',
      date: 'Вчера, 16:40',
      text: 'Коллеги, важный инсайт по итогам вчерашней сессии планирования. Когда вы определяете фокусные группы (А, В, С), обязательно берите во внимание не только академическую успеваемость, но и социальную активность ребенка. Иногда тихоня со средними оценками раскрывается как лидер, если убрать из группы доминирующего лидера.',
      comments: [
        { id: 1, author: 'Мариям И.', text: 'Полностью согласна, на последнем цикле столкнулись именно с этим.' }
      ]
    }
  ]);

  // Развернуть/свернуть комментарии к посту
  toggleComments(postId: number) {
    if (this.expandedPostId() === postId) {
      this.expandedPostId.set(null);
    } else {
      this.expandedPostId.set(postId);
    }
  }

  // Создать новый пост в блоге
  onCreatePost(event: Event) {
    event.preventDefault();
    if (!this.newPostText().trim()) return;

    const newPost: Post = {
      id: Date.now(),
      author: 'Вы (Учитель-Исследователь)',
      avatar: '👤',
      date: 'Только что',
      text: this.newPostText(),
      image: this.newPostImage().trim() ? this.newPostImage().trim() : undefined,
      comments: []
    };

    // Обновляем массив постов с добавлением нового в самое начало ленты
    this.posts.set([newPost, ...this.posts()]);

    // Очищаем форму
    this.newPostText.set('');
    this.newPostImage.set('');
  }

  // Добавить новый комментарий к посту
  addComment(postId: number, commentText: string) {
    if (!commentText.trim()) return;

    const updatedPosts = this.posts().map(post => {
      if (post.id === postId) {
        const newComment: Comment = {
          id: Date.now(),
          author: 'Вы',
          text: commentText
        };
        return {
          ...post,
          comments: [...post.comments, newComment]
        };
      }
      return post;
    });

    this.posts.set(updatedPosts);
  }
}