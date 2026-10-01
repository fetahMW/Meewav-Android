/** A permission dialog cannot be cancelled, so reject and stop any stream that
 * arrives after its preview was closed, hidden or replaced. */
export function createMediaRequestGate({ isActive = () => true } = {}) {
  let generation = 0, closed = false;
  const isCurrent = request => !closed && request === generation && isActive();
  return {
    begin() { return ++generation; },
    isCurrent,
    accept(request, stream) {
      if (isCurrent(request)) return true;
      stream.getTracks().forEach(track => track.stop());
      return false;
    },
    invalidate() { generation++; },
    reopen() { closed = false; generation++; },
    close() { closed = true; generation++; },
  };
}
