export type SessionLog = {
  durationMs: number;
  completedAt: number;
};

export const totalDuration = (logs: SessionLog[]) => logs.reduce((sum, log) => sum + log.durationMs, 0);

export const averageDuration = (logs: SessionLog[]) => {
  if (!logs.length) return 0;
  return Math.round(totalDuration(logs) / logs.length);
};

export const bestStreak = (logs: SessionLog[]) => {
  if (!logs.length) return 0;
  const days = logs
    .map((log) => new Date(log.completedAt).toDateString())
    .reduce<Record<string, number>>((map, day) => ({ ...map, [day]: (map[day] || 0) + 1 }), {});
  return Math.max(...Object.values(days));
};
