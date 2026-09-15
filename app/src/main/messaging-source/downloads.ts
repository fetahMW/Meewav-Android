type Download = { id: string; name: string; mime: string; bytes: Uint8Array };
const queue: Download[] = [];
let preparing = Promise.resolve();
function offer() {
  if (queue[0]) location.assign(`https://appassets.androidplatform.net/native/save?id=${queue[0].id}`);
}
export function saveAttachment(name: string, source: Blob | string) {
  preparing = preparing.then(async () => {
    const response = source instanceof Blob ? null : await fetch(source);
    if (response && !response.ok) throw Error('unavailable');
    const blob = source instanceof Blob ? source : await response!.blob();
    if (blob.size > 64 * 1024 * 1024) throw Error('too_large');
    const item = { id: crypto.randomUUID(), name: name.replace(/[\\/\x00-\x1f]/g, '_').slice(0, 160), mime: blob.type || 'application/octet-stream', bytes: new Uint8Array(await blob.arrayBuffer()) };
    queue.push(item); if (queue.length === 1) offer();
  }).catch(() => window.dispatchEvent(new Event('meewav:download-error')));
}
(window as any).meewavDownloads = {
  describe(id: string) {
    const item = queue[0];
    return item?.id === id ? { name: item.name, mime: item.mime, size: item.bytes.length } : null;
  },
  chunk(id: string, offset: number) {
    const item = queue[0]; if (item?.id !== id || offset < 0) return null;
    let binary = '';
    for (const byte of item.bytes.subarray(offset, offset + 49152)) binary += String.fromCharCode(byte);
    return btoa(binary);
  },
  complete(id: string) { if (queue[0]?.id === id) { queue.shift(); offer(); } },
};
