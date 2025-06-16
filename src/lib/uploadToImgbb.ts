export async function uploadToImgbb(file: File): Promise<string> {
  const apiKey = '799956b901b3d647e5dc198601d9040d';
  const fd = new FormData();
  fd.append('image', file);
  const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
    method: 'POST',
    body: fd,
  });
  const json = await res.json();
  return json.data.display_url as string;
}