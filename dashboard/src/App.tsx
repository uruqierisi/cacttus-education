import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/auth-context';
import { router } from '@/router';
import { QUERY_STALE_TIME_MS } from '@/lib/constants';
import { toApiError } from '@/lib/api-error';

const MAX_QUERY_RETRIES = 2;
const CLIENT_ERROR_FLOOR = 400;
const CLIENT_ERROR_CEILING = 500;

/**
 * Retrying a 4xx is pointless — the request is wrong, not unlucky — so retries are
 * limited to network and 5xx failures.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: QUERY_STALE_TIME_MS,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        const status = toApiError(error).status;
        if (status >= CLIENT_ERROR_FLOOR && status < CLIENT_ERROR_CEILING) {
          return false;
        }
        return failureCount < MAX_QUERY_RETRIES;
      },
    },
    mutations: { retry: false },
  },
});

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </QueryClientProvider>
  );
}
