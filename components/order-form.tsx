'use client';

import { z } from 'zod';
import { useState } from 'react';

const schema = z.object({ customerPersonId: z.string().uuid(), notes: z.string().max(500).optional() });

export function OrderForm() {
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="rounded-lg border bg-white p-4 space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const parsed = schema.safeParse({ customerPersonId: formData.get('customerPersonId'), notes: formData.get('notes') });
        setError(parsed.success ? null : parsed.error.issues[0]?.message ?? 'Validation failed');
      }}
    >
      <h3 className="font-medium">Create / Edit Order</h3>
      <input name="customerPersonId" placeholder="Customer person UUID" className="w-full border rounded p-2" />
      <textarea name="notes" placeholder="Notes" className="w-full border rounded p-2" />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Save Draft</button>
    </form>
  );
}
