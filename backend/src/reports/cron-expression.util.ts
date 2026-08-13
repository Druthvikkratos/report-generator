import { ScheduleFrequency } from '@prisma/client';

export function buildCornExpression(
  frequency: ScheduleFrequency,
  time: Date,
  dayOfWeek?: number | null,
): string {
  const hour = time.getUTCHours();
  const minute = time.getUTCMinutes();

  switch (frequency) {
    case 'DAILY':
      return `${minute} ${hour} * * *`;

    case 'WEEKLY': {
      if (dayOfWeek === null || dayOfWeek === undefined) {
        throw new Error('dayOfWeek is required for WEEKLY frequency');
      }
    }
    case 'MONTHLY':
        return `${minute} ${hour} 1 * *`;

    default:
        throw new Error(`Unsupported frequency: ${frequency}`)
  }
}
