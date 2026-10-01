// Lossless worker-side indexing. Equality includes every Float32 bit of every
// attribute: territory IDs, wall/cap colours and material seams never merge.
export function indexTriangleAttributes(attributes) {
  const count = attributes.position?.length / 3;
  if (!count) return attributes;
  const fields = Object.entries(attributes).map(([name, array]) => ({ name, array,
    size: array.length / count, words: new Uint32Array(array.buffer, array.byteOffset, array.length) }));
  const bytesPerVertex = fields.reduce((sum, field) => sum + field.size * 4, 0);
  const sources = [], buckets = new Map(), indices = new Uint32Array(count);
  const equal = (a, b) => fields.every(field => {
    for (let component = 0; component < field.size; component++) {
      if (field.words[a * field.size + component] !== field.words[b * field.size + component]) return false;
    }
    return true;
  });
  for (let vertex = 0; vertex < count; vertex++) {
    let hash = 2166136261;
    for (const field of fields) for (let component = 0; component < field.size; component++) {
      hash = Math.imul(hash ^ field.words[vertex * field.size + component], 16777619) >>> 0;
    }
    const bucket = buckets.get(hash);
    let index = -1;
    if (typeof bucket === 'number') { if (equal(vertex, sources[bucket])) index = bucket; }
    else if (bucket) { for (const candidate of bucket) if (equal(vertex, sources[candidate])) { index = candidate; break; } }
    if (index < 0) {
      index = sources.length; sources.push(vertex);
      if (bucket === undefined) buckets.set(hash, index);
      else if (typeof bucket === 'number') buckets.set(hash, [bucket, index]);
      else bucket.push(index);
    }
    indices[vertex] = index;
  }
  const IndexArray = sources.length <= 65535 ? Uint16Array : Uint32Array;
  if (sources.length * bytesPerVertex + count * IndexArray.BYTES_PER_ELEMENT >= count * bytesPerVertex) return attributes;
  const result = {};
  for (const field of fields) {
    const array = new Float32Array(sources.length * field.size), words = new Uint32Array(array.buffer);
    sources.forEach((source, index) => {
      for (let component = 0; component < field.size; component++) words[index * field.size + component] = field.words[source * field.size + component];
    });
    result[field.name] = array;
  }
  result.index = new IndexArray(indices);
  return result;
}
