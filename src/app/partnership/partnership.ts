import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface SchoolPartner {
  id: number;
  name: string;
  type: string;
  district: string;
  location: string;
  director: string;
  phone: string;
}

@Component({
  selector: 'app-partnership',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './partnership.html',
  styleUrl: './partnership.css'
})
export class PartnershipComponent {
  
  // Сигнал для отслеживания выбранной школы (для показа в модальном окне)
  selectedSchool = signal<SchoolPartner | null>(null);

  // Список 10 реальных школ Алматы
  schools = signal<SchoolPartner[]>([
    {
      id: 1,
      name: 'Гимназия №159 им. Ы. Алтынсарина',
      type: 'Гимназия',
      district: 'Медеуский',
      location: 'г. Алматы, ул. Богенбай батыра, 84',
      director: 'Аяпова Гульнас Куирбаевна',
      phone: '+7 (727) 291-52-84'
    },
    {
      id: 2,
      name: 'Лицей №134',
      type: 'Лицей',
      district: 'Алмалинский',
      location: 'г. Алматы, ул. Шевченко, 124',
      director: 'Нурсеитова Гулнар Жаксылыковна',
      phone: '+7 (727) 292-13-14'
    },
    {
      id: 3,
      name: 'Школа-гимназия №140 им. К. Макаblockева',
      type: 'Школа-гимназия',
      district: 'Бостандыкский',
      location: 'г. Алматы, мкр. Коктем-1, 14А',
      director: 'Санатова Сания Тлеужановна',
      phone: '+7 (727) 394-40-51'
    },
    {
      id: 4,
      name: 'Специализированный лицей №39 им. С. Асфендиярова',
      type: 'Специализированный лицей',
      district: 'Бостандыкский',
      location: 'г. Алматы, ул. Маркова, 26',
      director: 'Касымбекова Назипа Султанмуратовна',
      phone: '+7 (727) 292-67-12'
    },
    {
      id: 5,
      name: 'Общеобразовательная школа №95',
      type: 'Общеобразовательная школа',
      district: 'Турксибский',
      location: 'г. Алматы, ул. Майлина, 79',
      director: 'Абдиманапова Бахыт Камаловна',
      phone: '+7 (727) 251-33-40'
    },
    {
      id: 6,
      name: 'Гимназия №105 им. О. Жандосова',
      type: 'Гимназия',
      district: 'Ауэзовский',
      location: 'г. Алматы, мкр. Мамыр-1, 23/1',
      director: 'Кунакова Алима Раймжановна',
      phone: '+7 (727) 381-64-20'
    },
    {
      id: 7,
      name: 'Школа-лицей №169',
      type: 'Школа-лицей',
      district: 'Алатауский',
      location: 'г. Алматы, мкр. Акбулак, ул. Хан Тенгри, 22',
      director: 'Шаханова Меруерт Сейтказыевна',
      phone: '+7 (727) 243-98-11'
    },
    {
      id: 8,
      name: 'Общеобразовательная школа №125',
      type: 'Общеобразовательная школа',
      district: 'Жетысуский',
      location: 'г. Алматы, ул. Серикова, 2А',
      director: 'Искакова Шолпан Касымовна',
      phone: '+7 (727) 294-11-20'
    },
    {
      id: 9,
      name: 'Лицей №90',
      type: 'Лицей',
      district: 'Бостандыкский',
      location: 'г. Алматы, ул. Казыбек би, 137',
      director: 'Турсумбаева Светлана Савельевна',
      phone: '+7 (727) 279-55-10'
    },
    {
      id: 10,
      name: 'Школа-лицей №71',
      type: 'Школа-лицей',
      district: 'Наурызбайский',
      location: 'г. Алматы, мкр. Калкаман-2, ул. Ашимова, 120',
      director: 'Смагулова Кенжегул Маратовна',
      phone: '+7 (727) 307-88-15'
    }
  ]);

  // Открыть окно с деталями школы
  openSchoolDetails(school: SchoolPartner) {
    this.selectedSchool.set(school);
  }

  // Закрыть окно
  closeModal() {
    this.selectedSchool.set(null);
  }
}