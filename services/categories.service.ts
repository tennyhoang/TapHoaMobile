import { api } from '@/lib/api';
import type { Category } from '@/types';

export const categoriesService = {
  getAll: (): Promise<Category[]> => api.get<Category[]>('/categories'),
};
