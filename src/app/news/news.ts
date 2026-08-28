import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NewsService } from './news.service';
import { NewsItem } from './news.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-news',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './news.html',
  styleUrls: ['./news.css']
})
export class NewsComponent implements OnInit {
  newsList = signal<NewsItem[]>([]);
  selectedNews = signal<NewsItem | null>(null);
  isLoading = signal<boolean>(true);
  isCopied = signal<boolean>(false);

  // Пагинация
  currentPage = signal<number>(1);
  pageSize = 12;

  totalPages = computed(() => Math.ceil(this.newsList().length / this.pageSize) || 1);
  paginatedNews = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.newsList().slice(start, start + this.pageSize);
  });
  pagesArray = computed(() => Array.from({ length: this.totalPages() }, (_, i) => i + 1));

  constructor(private newsService: NewsService, private router: Router) {}

  goBackToMainMenu(): void {
    this.router.navigate(['/login']);
  }

  ngOnInit(): void {
    this.newsService.getNewsLive().subscribe({
      next: (data) => {
        const formattedData = data.map(item => ({
          ...item,
          date: this.formatDate(item.createdAt || item.date)
        }));

        formattedData.sort((a, b) => {
          const timeA = this.getTimestamp(a.createdAt || a.date);
          const timeB = this.getTimestamp(b.createdAt || b.date);
          return timeB - timeA;
        });

        this.newsList.set(formattedData);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Ошибка загрузки новостей:', err);
        this.isLoading.set(false);
      }
    });
  }

  // --- ХЕЛПЕРЫ ДЛЯ ФОРМАТИРОВАНИЯ И СОРТИРОВКИ ДАТЫ ---
  formatDate(dateValue: any): string {
    if (!dateValue) return 'Недавно';

    let date: Date;

    if (typeof dateValue === 'object' && dateValue !== null && 'seconds' in dateValue) {
      date = new Date(dateValue.seconds * 1000);
    } else if (typeof dateValue === 'number') {
      date = dateValue < 10000000000 ? new Date(dateValue * 1000) : new Date(dateValue);
    } else {
      date = new Date(dateValue);
    }

    if (isNaN(date.getTime())) {
      return String(dateValue);
    }

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day}.${month}.${year} ${hours}:${minutes}`;
  }

  getTimestamp(dateValue: any): number {
    if (!dateValue) return 0;
    if (typeof dateValue === 'object' && dateValue !== null && 'seconds' in dateValue) {
      return dateValue.seconds * 1000;
    }
    const t = new Date(dateValue).getTime();
    return isNaN(t) ? Number(dateValue) || 0 : t;
  }

  // --- УПРАВЛЕНИЕ ОКНОМ И ПАГИНАЦИЕЙ ---
  setPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      window.scrollTo({ top: 400, behavior: 'smooth' });
    }
  }

  openModal(item: NewsItem): void {
    this.selectedNews.set(item);
    document.body.style.overflow = 'hidden';
  }

  closeModal(): void {
    this.selectedNews.set(null);
    this.isCopied.set(false);
    document.body.style.overflow = '';
  }

  // --- ШЕРИНГ ---
  share(platform: string): void {
    const item = this.selectedNews();
    if (!item) return;

    const currentUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(item.title);
    let shareUrl = '';

    switch (platform) {
      case 'telegram': shareUrl = `https://t.me/share/url?url=${currentUrl}&text=${title}`; break;
      case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${title}%20${currentUrl}`; break;
      case 'vk': shareUrl = `https://vk.com/share.php?url=${currentUrl}&title=${title}`; break;
      case 'twitter': shareUrl = `https://twitter.com/intent/tweet?url=${currentUrl}&text=${title}`; break;
      case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}`; break;
    }

    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=500');
    }
  }

  copyLink(): void {
    navigator.clipboard.writeText(window.location.href).then(() => {
      this.isCopied.set(true);
      setTimeout(() => this.isCopied.set(false), 2000);
    });
  }
}