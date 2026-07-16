const DEFAULT_CYCLE_LENGTH = 28;
const DEFAULT_PERIOD_LENGTH = 5;
const LOOKBACK = 6; // 최근 N개 주기만 반영한 이동평균

function parseDate(str) {
  const [y, m, d] = str.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date, days) {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
}

function diffDays(a, b) {
  return Math.round((a.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function average(numbers) {
  return numbers.reduce((sum, n) => sum + n, 0) / numbers.length;
}

/**
 * logs: [{ start_date: 'YYYY-MM-DD', end_date: 'YYYY-MM-DD' | null }, ...]
 * 오래된 순 -> 최신 순으로 정렬되어 있지 않아도 됨 (내부에서 정렬함).
 *
 * 새 실제 시작일이 기록될 때마다 직전 주기와의 실제 간격을 반영해
 * 평균 주기 길이를 다시 계산하므로, 예정일보다 빠르거나 늦게 시작해도
 * 다음 예측이 그 변동폭을 따라간다.
 */
export function computePrediction(logs) {
  const sorted = [...logs].sort((a, b) => (a.start_date < b.start_date ? -1 : 1));

  if (sorted.length === 0) {
    return {
      hasData: false,
      avgCycleLength: DEFAULT_CYCLE_LENGTH,
      avgPeriodLength: DEFAULT_PERIOD_LENGTH,
      lastStartDate: null,
      nextPredictedStart: null,
      predictedPeriodEnd: null,
      ovulationDate: null,
      fertileWindowStart: null,
      fertileWindowEnd: null,
    };
  }

  const cycleLengths = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseDate(sorted[i - 1].start_date);
    const curr = parseDate(sorted[i].start_date);
    const len = diffDays(curr, prev);
    if (len > 0 && len < 90) cycleLengths.push(len); // 이상치 방어
  }
  const recentCycleLengths = cycleLengths.slice(-LOOKBACK);

  const periodLengths = sorted
    .filter((l) => l.end_date)
    .map((l) => diffDays(parseDate(l.end_date), parseDate(l.start_date)) + 1)
    .filter((len) => len > 0 && len < 20);
  const recentPeriodLengths = periodLengths.slice(-LOOKBACK);

  const avgCycleLength = recentCycleLengths.length
    ? Math.round(average(recentCycleLengths))
    : DEFAULT_CYCLE_LENGTH;
  const avgPeriodLength = recentPeriodLengths.length
    ? Math.round(average(recentPeriodLengths))
    : DEFAULT_PERIOD_LENGTH;

  const lastStart = parseDate(sorted[sorted.length - 1].start_date);
  const nextPredictedStart = addDays(lastStart, avgCycleLength);
  const predictedPeriodEnd = addDays(nextPredictedStart, avgPeriodLength - 1);
  const ovulationDate = addDays(nextPredictedStart, -14);
  const fertileWindowStart = addDays(ovulationDate, -5);
  const fertileWindowEnd = addDays(ovulationDate, 1);

  return {
    hasData: true,
    avgCycleLength,
    avgPeriodLength,
    lastStartDate: formatDate(lastStart),
    nextPredictedStart: formatDate(nextPredictedStart),
    predictedPeriodEnd: formatDate(predictedPeriodEnd),
    ovulationDate: formatDate(ovulationDate),
    fertileWindowStart: formatDate(fertileWindowStart),
    fertileWindowEnd: formatDate(fertileWindowEnd),
  };
}
