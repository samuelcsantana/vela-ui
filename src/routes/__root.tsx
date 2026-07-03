import { createRootRoute, Outlet } from '@tanstack/react-router';
import { Suspense, lazy } from 'react';
import { Toast } from '../components/Toast';
import { useThemeEffect } from '../hooks/use-theme-effect';

const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then((mod) => ({
          default: mod.TanStackRouterDevtools,
        })),
      );

export const Route = createRootRoute({
  component: RootComponent,
});

function RootComponent() {
  useThemeEffect();

  return (
    <>
      <Outlet />
      <Toast />
      <Suspense>
        <TanStackRouterDevtools />
      </Suspense>
    </>
  );
}
