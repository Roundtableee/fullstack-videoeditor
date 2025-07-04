// src/utils/upload.ts
const BASE = import.meta.env.VITE_PUBLIC_BACKEND_BASE_URL;

export interface IUploadDetails {
  id: string;
  url: string;
  name: string;
}

export async function uploadVideo(file: File): Promise<IUploadDetails> {
  const form = new FormData();
  form.append('video', file, file.name);

  const res = await fetch(`${BASE}/upload`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  const { id, url } = await res.json();
  return {
    id,
    url: `${BASE}${url}`,
    name: file.name,
  };
}
