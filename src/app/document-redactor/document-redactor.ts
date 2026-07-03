import { Component, OnInit, OnDestroy, signal, inject, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http'; 
import { AuthService } from '../auth'; 
import { firstValueFrom } from 'rxjs';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

@Component({
  selector: 'app-document-redactor',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './document-redactor.html',
  styleUrls: ['./document-redactor.css']
})
export class DocumentRedactorComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private http = inject(HttpClient); 

  @ViewChild('subSheet') subSheet!: ElementRef<HTMLDivElement>;
  
  private aiWebhookUrl = 'https://lessonstudy11.app.n8n.cloud/webhook/redactor-ai';

  researchId = signal<string | null>(null);
  researchTitle = signal<string>('Загрузка документа...');
  
  // ХРАНИМ СТРАНИЦЫ КАК МАССИВ СТРОК — БЕЗ СТРЕМНЫХ МАРКЕРОВ
  pages = signal<string[]>(['<p><br></p>']);
  currentPageIndex = signal<number>(0);

  isSaving = signal<boolean>(false);
  isAiThinking = signal<boolean>(false); 
  isDocumentLoading = false;
  private saveTimeout: any = null;

  isMobileAiOpen = signal<boolean>(false);
  chatInput = signal<string>('');
  messages = signal<Message[]>([
    { sender: 'ai', text: 'Привет! Я твой ИИ-ассистент. Напиши мне, что добавить в текст.', timestamp: new Date() }
  ]);

  // Аналитика собирает текст со всех страниц массива
  stats = computed(() => {
    const fullText = this.pages().map(p => this.stripHtml(p)).join(' ');
    const charCount = fullText.length;
    const wordCount = fullText.trim() === '' ? 0 : fullText.trim().split(/\s+/).length;
    return { words: wordCount, chars: charCount, totalPages: this.pages().length };
  });

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/dashboard']);
      return;
    }
    this.researchId.set(id);

    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        await this.loadDocument();
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  ngOnDestroy() {
    this.isDocumentLoading = true; 
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
  }

  goBack() { 
    this.isDocumentLoading = true; 
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.router.navigate(['/dashboard']); 
  }

  toggleMobileAi() { this.isMobileAiOpen.set(!this.isMobileAiOpen()); }

  // НАВИГАЦИЯ ПО СТРАНИЦАМ
  goToPage(index: number) {
    if (index < 0 || index >= this.pages().length) return;
    
    // Сохраняем текущую страницу перед переходом
    if (this.subSheet) {
      const currentHtml = this.subSheet.nativeElement.innerHTML;
      this.updatePageContentInMemory(this.currentPageIndex(), currentHtml);
    }

    this.currentPageIndex.set(index);
    
    // Рендерим контент новой страницы в редактор
    if (this.subSheet) {
      this.subSheet.nativeElement.innerHTML = this.pages()[index];
    }
  }

  addPage() {
    // Сохраняем контент текущей
    if (this.subSheet) {
      this.updatePageContentInMemory(this.currentPageIndex(), this.subSheet.nativeElement.innerHTML);
    }

    const updatedPages = [...this.pages(), '<p><br></p>'];
    this.pages.set(updatedPages);
    this.currentPageIndex.set(updatedPages.length - 1);

    if (this.subSheet) {
      this.subSheet.nativeElement.innerHTML = '<p><br></p>';
    }
    this.saveDocument();
  }

  removePage() {
    if (this.pages().length <= 1) {
      alert('Нельзя удалить единственную страницу!');
      return;
    }
    if (!confirm('Вы уверены, что хотите удалить текущую страницу?')) return;

    const indexToRemove = this.currentPageIndex();
    const updatedPages = this.pages().filter((_, i) => i !== indexToRemove);
    
    this.pages.set(updatedPages);
    const newIndex = Math.max(0, indexToRemove - 1);
    this.currentPageIndex.set(newIndex);

    if (this.subSheet) {
      this.subSheet.nativeElement.innerHTML = this.pages()[newIndex];
    }
    this.saveDocument();
  }

  private updatePageContentInMemory(index: number, html: string) {
    const currentPages = [...this.pages()];
    currentPages[index] = html;
    this.pages.set(currentPages);
  }

  async loadDocument() {
    try {
      this.isDocumentLoading = true; 
      const allResearches = await this.authService.getResearches();
      const currentDoc = allResearches.find(r => r.id === this.researchId());

      if (currentDoc) {
        this.researchTitle.set(currentDoc.title);
        
        // База данных теперь отдает либо массив страниц, либо старую строку (для совместимости)
        let rawData = currentDoc.rawContent; 
        
        if (Array.isArray(rawData)) {
          this.pages.set(rawData.length > 0 ? rawData : ['<p><br></p>']);
        } else if (typeof rawData === 'string' && rawData.trim() !== '') {
          // Если старый формат — оборачиваем всю строку в первую страницу
          this.pages.set([rawData]);
        } else {
          this.pages.set(['<p><br></p>']);
        }

        this.currentPageIndex.set(0);
        if (this.subSheet) {
          this.subSheet.nativeElement.innerHTML = this.pages()[0];
        }

        setTimeout(() => { this.isDocumentLoading = false; }, 300);
      }
    } catch (error) {
      this.isDocumentLoading = false;
      console.error(error);
    }
  }

  onContentChange(event: Event) {
    if (this.isDocumentLoading) return;
    const html = (event.target as HTMLElement).innerHTML;
    
    this.updatePageContentInMemory(this.currentPageIndex(), html);
    
    if (this.saveTimeout) clearTimeout(this.saveTimeout);
    this.saveTimeout = setTimeout(() => this.saveDocument(), 1500);
  }

  async saveDocument() {
    if (this.isDocumentLoading || !this.researchId()) return;
    this.isSaving.set(true);
    try {
      // Передаем в Firebase чистый массив страниц string[]
      await this.authService.updateResearchContent(this.researchId()!, this.pages() as any);
      this.isSaving.set(false);
    } catch (error) {
      this.isSaving.set(false);
    }
  }

  format(command: string, value: string = '') {
    document.execCommand(command, false, value);
    if (this.subSheet) {
      this.updatePageContentInMemory(this.currentPageIndex(), this.subSheet.nativeElement.innerHTML);
      this.saveDocument();
    }
  }

  async sendAiMessage() {
    const prompt = this.chatInput().trim();
    if (!prompt || this.isAiThinking()) return;

    this.messages.set([...this.messages(), { sender: 'user', text: prompt, timestamp: new Date() }]);
    this.chatInput.set('');
    this.isAiThinking.set(true);

    try {
      const payload = {
      action: 'chat_and_edit',
      researchId: this.researchId(),
      documentTitle: this.researchTitle(),
  
      // Отправляем ТОЛЬКО ту страницу, которую редактируем в данный момент:
      currentContent: this.pages()[this.currentPageIndex()], 
  
      // Дополнительно подсказываем ИИ номер страницы на случай, если это важно для контекста
      currentPageNumber: this.currentPageIndex() + 1,
      totalDocPages: this.pages().length,
  
      userPrompt: prompt,
      stats: this.stats()
    };

      const rawResponse = await firstValueFrom(this.http.post<any>(this.aiWebhookUrl, payload));
      const dataToProcess = rawResponse && rawResponse.output ? rawResponse.output : rawResponse;
      
      let parsedData: any = typeof dataToProcess === 'string' ? JSON.parse(dataToProcess) : dataToProcess;

      if (parsedData && parsedData.updatedHtmlContent) {
        // ИИ вернул новый контент. Запишем его в текущую страницу, либо распределим
        this.updatePageContentInMemory(this.currentPageIndex(), parsedData.updatedHtmlContent);
        if (this.subSheet) {
          this.subSheet.nativeElement.innerHTML = parsedData.updatedHtmlContent;
        }
        this.saveDocument();
      }

      const textForChat = parsedData?.aiResponse || 'Изменения внесены.';
      this.messages.set([...this.messages(), { sender: 'ai', text: textForChat, timestamp: new Date() }]);
    } catch (error) {
      this.messages.set([...this.messages(), { sender: 'ai', text: 'Ошибка сети.', timestamp: new Date() }]);
    } finally {
      this.isAiThinking.set(false);
    }
  }

  downloadFile(format: 'doc' | 'pdf') {
    // При скачивании просто склеиваем страницы воедино для экспорта
    const fullHtml = this.pages().join('<br style="page-break-before: always;">');
    const titleText = this.researchTitle();

    if (format === 'doc') {
      const finalHtml = this.wrapInWordTemplate(titleText, fullHtml);
      const blob = new Blob([new TextEncoder().encode(finalHtml)], { type: 'application/msword' });
      this.triggerDownload(blob, `${titleText}.doc`);
    } else {
      const finalHtml = this.wrapInPdfTemplate(titleText, fullHtml);
      const blob = new Blob([finalHtml], { type: 'text/html;charset=utf-8' });
      window.open(URL.createObjectURL(blob), '_blank');
    }
  }

  private triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = filename;
    document.body.appendChild(link); link.click();
    document.body.removeChild(link); URL.revokeObjectURL(url);
  }

  private wrapInWordTemplate(title: string, content: string) {
    return `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8"></head><body>${content}</body></html>`;
  }

  private wrapInPdfTemplate(title: string, content: string) {
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body { font-family: Arial; padding: 50px; } @media print { body { padding: 0; } }</style></head><body>${content}<script>window.onload = function() { window.print(); }</script></body></html>`;
  }

  private stripHtml(html: string): string {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }
}