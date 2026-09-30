// Android's full globe keeps the accepted geometry profile, materials and
// interaction space. Only the record's redundant angular subdivisions change.
export function resolveVinylQuality(requested) {
  return requested === 'high' || requested === 'low' ? requested : 'mobile';
}

// Page visibility must never override a native off-screen/lifecycle pause.
// Without a native host, the standalone preview follows page visibility.
export function resolveGlobeActivity(nativeActive, pageHidden) {
  return !pageHidden && nativeActive !== false;
}
