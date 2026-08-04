/**
 * Pagination helpers. Every list endpoint funnels through here so no query can ever
 * be issued without a bounded LIMIT.
 */
import { PAGINATION } from '../config/constants';

export type PageParams = {
  readonly page: number;
  readonly pageSize: number;
};

export type PrismaPageArgs = {
  readonly skip: number;
  readonly take: number;
};

export function resolvePageParams(page?: number, pageSize?: number): PageParams {
  const safePage = Number.isFinite(page) && (page as number) > 0
    ? Math.floor(page as number)
    : PAGINATION.DEFAULT_PAGE;

  const requestedSize = Number.isFinite(pageSize) && (pageSize as number) > 0
    ? Math.floor(pageSize as number)
    : PAGINATION.DEFAULT_PAGE_SIZE;

  return {
    page: safePage,
    pageSize: Math.min(requestedSize, PAGINATION.MAX_PAGE_SIZE),
  };
}

export function toPrismaPageArgs({ page, pageSize }: PageParams): PrismaPageArgs {
  return {
    skip: (page - 1) * pageSize,
    take: pageSize,
  };
}
