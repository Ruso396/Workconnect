export interface NotificationDateSection<T> {
  title: string;
  data: T[];
}

function startOfLocalDay(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return x;
}

function localEpochDay(d: Date): number {
  const s = startOfLocalDay(d);
  return Math.floor(s.getTime() / 86400000);
}

function formatOlderDayLabel(d: Date): string {
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type Classified = { bucketKey: string; title: string; sortRank: number };

function classifyNotificationDate(created: Date, now: Date): Classified {
  const nowDay = localEpochDay(now);
  const cDay = localEpochDay(created);
  const diff = nowDay - cDay;

  if (diff === 0) {
    return { bucketKey: '__today', title: 'Today', sortRank: 0 };
  }
  if (diff === 1) {
    return { bucketKey: '__yesterday', title: 'Yesterday', sortRank: 1 };
  }
  if (diff >= 2 && diff <= 6) {
    return { bucketKey: '__this_week', title: 'This Week', sortRank: 2 };
  }

  const dayStart = startOfLocalDay(created);
  const key = `__old_${dayStart.getTime()}`;
  return {
    bucketKey: key,
    title: formatOlderDayLabel(created),
    sortRank: 100 + diff,
  };
}

/**
 * Groups items newest-first into sections: Today, Yesterday, This week, then older calendar days (newest day first).
 */
export function groupItemsByNotificationDate<T>(
  items: T[],
  getCreatedAt: (item: T) => string | undefined | null,
): NotificationDateSection<T>[] {
  const now = new Date();

  const sorted = [...items].sort((a, b) => {
    const ta = new Date(getCreatedAt(a) ?? 0).getTime();
    const tb = new Date(getCreatedAt(b) ?? 0).getTime();
    return tb - ta;
  });

  const buckets = new Map<
    string,
    {
      title: string;
      sortRank: number;
      data: T[];
    }
  >();

  for (const item of sorted) {
    const raw = getCreatedAt(item);
    const created = raw ? new Date(raw) : null;
    if (!created || Number.isNaN(created.getTime())) {
      const key = '__unknown';
      if (!buckets.has(key)) {
        buckets.set(key, { title: 'Earlier', sortRank: 999999, data: [] });
      }
      buckets.get(key)!.data.push(item);
      continue;
    }

    const { bucketKey, title, sortRank } = classifyNotificationDate(created, now);
    if (!buckets.has(bucketKey)) {
      buckets.set(bucketKey, { title, sortRank, data: [] });
    }
    buckets.get(bucketKey)!.data.push(item);
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.sortRank - b.sortRank)
    .map(({ title, data }) => ({ title, data }));
}
