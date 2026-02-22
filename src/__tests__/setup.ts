// oclif registers listeners on process streams at module load time. Since Jest
// re-initialises modules per test file (even with -i), listeners accumulate
// across suites and exceed Node's default limit of 10.
//
// Top-level code here runs before the test file's imports, so we snapshot
// the current listeners now and restore after each suite in afterAll.
const EVENTS = ['error', 'resize', 'close', 'finish', 'drain'];
const streams = [process.stdout, process.stderr, process.stdin] as const;

const snapshots = new Map(
  streams.map((stream) => [
    stream,
    new Map(EVENTS.map((event) => [event, [...(stream as NodeJS.EventEmitter).listeners(event)]])),
  ]),
);

afterAll(() => {
  for (const [stream, snapshot] of snapshots) {
    for (const [event, saved] of snapshot) {
      for (const listener of (stream as NodeJS.EventEmitter).listeners(event)) {
        if (!saved.includes(listener)) {
          (stream as NodeJS.EventEmitter).removeListener(event, listener as (...args: unknown[]) => void);
        }
      }
    }
  }
});
