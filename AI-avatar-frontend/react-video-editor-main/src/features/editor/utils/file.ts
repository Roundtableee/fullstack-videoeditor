export const getBlobFromUrl = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
};

export const getFileFromUrl = async (url: string): Promise<File> => {
  const response = await fetch(url, {
    mode: 'cors',           // ← enable CORS fetch
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
  }
  const blob = await response.blob();
  const filename = url.split('/').pop() || 'video.mp4';
  // Preserve the blob’s MIME type
  return new File([blob], filename, { type: blob.type });
};

export const fileToBlob = async (file: File) => {
  const blob = await new Response(file.stream()).blob();
  return blob;
};

export const blobToStream = async (blob: Blob) => {
  const file = new File([blob], "video.mp4");
  const stream = file.stream();
  return stream;
};

export const getStreamFromUrl = async (url: string) => {
  const response = await fetch(url);
  const blob = await response.blob();
  const file = new File([blob], "video.mp4");
  const stream = file.stream();
  return stream;
};
