import { useQuery } from '@tanstack/react-query';
import { articlesService, type Article } from '@/services/articles.service';
import { queryKeys } from './queryKeys';
import type { UseQueryOptions } from '@tanstack/react-query';

export function useArticles(options?: Partial<UseQueryOptions<Article[]>>) {
  return useQuery({
    queryKey: queryKeys.articles.all,
    queryFn: () => articlesService.getAll(),
    staleTime: 120_000,
    ...options,
  });
}
