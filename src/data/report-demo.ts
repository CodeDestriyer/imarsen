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
  category: 'HTN',
  currentScore: 7.2,
  potentialScore: 8.5,
  summary:
    'Лицо находится в зоне High-Tier Normie. Хорошие пропорции и симметрия. Основной потенциал роста — в состоянии кожи и чёткости овала.',
  weakZones: ['Кожа', 'Тон кожи'],
  metrics: [
    { name: 'Пропорции лица', score: 7.5 },
    { name: 'Симметрия', score: 7.8 },
    { name: 'Кожа', score: 6.5, flag: 'warning' },
    { name: 'Челюсть', score: 7.2 },
    { name: 'Скулы', score: 7.0 },
    { name: 'Нос', score: 7.4 },
    { name: 'Глаза', score: 7.6, flag: 'star' },
    { name: 'Губы', score: 7.0 },
    { name: 'Лоб', score: 7.3 },
    { name: 'Глазницы', score: 7.1 },
    { name: 'Контрастность', score: 7.4, flag: 'star' },
    { name: 'Волосы', score: 7.5 },
    { name: 'Тон кожи', score: 6.8, flag: 'warning' },
    { name: 'Овал', score: 7.2 },
    { name: 'Дефекты', score: 7.0 },
    { name: 'Нос/подбородок', score: 7.3 },
    { name: 'Линия волос', score: 7.4 },
  ] satisfies Metric[],
  roadmap: [
    { week: 1, title: 'Детокс и база', actions: ['Диета без сахара', 'Double cleanse', 'Мьюинг 2×15 мин'] },
    { week: 2, title: 'Активация', actions: ['Ретинол 0.1%', 'Силовые тренировки', 'Гуаша'] },
    { week: 3, title: 'Контур', actions: ['Mastic gum', 'Лимфодренаж', 'Контуринг'] },
    { week: 4, title: 'Фиксация', actions: ['TCA пилинг', 'Микротоки'] },
  ] satisfies WeekPhase[],
};
