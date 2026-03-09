import clsx from 'clsx';

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={clsx('inline-flex rounded-full px-2 py-1 text-xs font-medium', {
        'bg-amber-100 text-amber-700': status.includes('pending') || status.includes('draft'),
        'bg-blue-100 text-blue-700': status.includes('progress') || status.includes('transit'),
        'bg-emerald-100 text-emerald-700': status.includes('done') || status.includes('delivered') || status.includes('paid')
      })}
    >
      {status}
    </span>
  );
}
