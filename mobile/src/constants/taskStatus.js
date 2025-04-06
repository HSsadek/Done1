export const TASK_STATUS = {
  TODO: 'Yapılacak',
  IN_PROGRESS: 'Devam Etmekte',
  TO_TEST: 'Test Edilecek',
  DONE: 'Tamamlandı',
};

export const TASK_STATUS_COLORS = {
  [TASK_STATUS.TODO]: '#FF9800',        // Turuncu
  [TASK_STATUS.IN_PROGRESS]: '#2196F3', // Mavi
  [TASK_STATUS.TO_TEST]: '#9C27B0',     // Mor
  [TASK_STATUS.DONE]: '#4CAF50',        // Yeşil
};

export const TASK_STATUS_OPTIONS = Object.values(TASK_STATUS);
