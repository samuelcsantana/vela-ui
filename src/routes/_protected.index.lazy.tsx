import { createLazyFileRoute } from '@tanstack/react-router';

export const Route = createLazyFileRoute('/_protected/')({
  component: IndexComponent,
});

function IndexComponent() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
      <h1 className="text-2xl font-semibold text-slate-900">Welcome to Vela UI</h1>
      <p className="text-slate-500">Select an option from the sidebar menu to get started.</p>
    </div>
  );
}
