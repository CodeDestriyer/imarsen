export type MetricFlag = 'warning' | 'star' | null;

export type Metric = {
  name: string;
  score: number;
  flag?: MetricFlag;
};

export type WeekPhase = {
  week: number;
  title: string;
  actions: string[];
};

export const reportDemo = {
  category: 'LTN',
  currentScore: 5.4,
  potentialScore: 7.0,
  summary:
    'Лицо находится в зоне Low-Tier Normie. База есть — относительно сохранные глаза и волосы, но ряд параметров заметно отстаёт: состояние кожи, тон, общий овал и контур челюсти. Основной потенциал роста — в улучшении кожи и моделировании нижней трети.',
  weakZones: ['Кожа', 'Тон кожи', 'Овал'],
  metrics: [
    { name: 'Пропорции лица', score: 5.8 },
    { name: 'Симметрия', score: 6.2, flag: 'star' },
    { name: 'Кожа', score: 4.5, flag: 'warning' },
    { name: 'Челюсть', score: 5.0 },
    { name: 'Скулы', score: 5.2 },
    { name: 'Нос', score: 5.4 },
    { name: 'Глаза', score: 6.5, flag: 'star' },
    { name: 'Губы', score: 5.5 },
    { name: 'Лоб', score: 5.7 },
    { name: 'Глазницы', score: 5.3 },
    { name: 'Контрастность', score: 5.8 },
    { name: 'Волосы', score: 6.0, flag: 'star' },
    { name: 'Тон кожи', score: 4.8, flag: 'warning' },
    { name: 'Овал', score: 5.1, flag: 'warning' },
    { name: 'Дефекты', score: 5.0 },
    { name: 'Нос/подбородок', score: 5.4 },
    { name: 'Линия волос', score: 5.9 },
  ] satisfies Metric[],
  roadmap: [
    { week: 1, title: 'Детокс и база', actions: ['Диета без сахара', 'Double cleanse', 'Мьюинг 2×15 мин'] },
    { week: 2, title: 'Активация', actions: ['Ретинол 0.1%', 'Силовые тренировки', 'Гуаша'] },
    { week: 3, title: 'Контур', actions: ['Mastic gum', 'Лимфодренаж', 'Контуринг'] },
    { week: 4, title: 'Фиксация', actions: ['TCA пилинг', 'Микротоки'] },
  ] satisfies WeekPhase[],
};
