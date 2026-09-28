// Temporary RUN 1 diagnostic. Enabled only when the QA WebView sets the flag via CDP.
type DiagnosticFields = Record<string, string | number | boolean | null | undefined>;

export function createUiDiagnostic(stage: string, fields: DiagnosticFields = {}): void {
  try {
    if ((window as Window & { __ROOMS_CREATE_UI_DIAG?: boolean }).__ROOMS_CREATE_UI_DIAG !== true) return;
    console.info('[ROOMS_CREATE_UI_DIAG]', JSON.stringify({
      at: new Date().toISOString(), monotonicMs: Math.round(performance.now()), stage, ...fields,
    }));
  } catch {
    // Instrumentation must never affect room creation.
  }
}

export function diagnosticError(value: unknown): DiagnosticFields {
  if (!value || typeof value !== 'object') return { name: typeof value };
  const error = value as Record<string, unknown>;
  const stringField = (key: string) => typeof error[key] === 'string'
    ? String(error[key]).slice(0, 240).replace(/Bearer\s+\S+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[redacted]')
    : undefined;
  return {
    name: stringField('name'), code: stringField('code'),
    status: typeof error.status === 'number' ? error.status : undefined,
    message: stringField('message'),
  };
}
