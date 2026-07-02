if (typeof globalThis !== "undefined" && globalThis.performance?.measure) {
  const originalMeasure = globalThis.performance.measure.bind(globalThis.performance);

  globalThis.performance.measure = function (...args: Parameters<Performance["measure"]>) {
    try {
      return originalMeasure(...args);
    } catch {
      const measureName = typeof args[0] === "string" ? args[0] : "";
      const now = globalThis.performance.now();

      return {
        name: measureName,
        entryType: "measure",
        startTime: now,
        duration: 0,
        detail: null,
        toJSON() {
          return {
            name: this.name,
            entryType: this.entryType,
            startTime: this.startTime,
            duration: this.duration,
          };
        },
      } as PerformanceMeasure;
    }
  };
}
