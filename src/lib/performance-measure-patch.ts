if (typeof globalThis !== "undefined" && globalThis.performance?.measure) {
  const originalMeasure = globalThis.performance.measure.bind(globalThis.performance);
  globalThis.performance.measure = function (...args: Parameters<Performance["measure"]>) {
    try {
      return originalMeasure(...args);
    } catch {
      return null as unknown as ReturnType<Performance["measure"]>;
    }
  };
}
