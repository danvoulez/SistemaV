'use client';

import { useState } from 'react';

export function FileUploadForm() {
  const [name, setName] = useState('');

  return (
    <form className="rounded-lg border bg-white p-4 space-y-3">
      <h3 className="font-medium">Upload linked file</h3>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Object title" className="w-full border rounded p-2" />
      <input type="file" className="w-full text-sm" />
      <button type="button" className="px-3 py-2 rounded bg-slate-900 text-white text-sm">Upload to Supabase Storage</button>
    </form>
  );
}
