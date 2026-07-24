export interface AllocationInfo {
  pocketId: string | null;
  amount: number;
}

/**
 * Distribute a total delta across allocations pro-rata using highest-remainder method.
 * Ensures the sum of returned amounts equals totalDelta (within floating point precision).
 */
export function computeProRata(
  totalDelta: number,
  allocations: AllocationInfo[],
): AllocationInfo[] {
  if (!allocations.length) {
    return [{ pocketId: null, amount: totalDelta }];
  }

  const totalOriginal = allocations.reduce((s, a) => s + a.amount, 0);
  if (totalOriginal === 0) {
    return [{ pocketId: null, amount: totalDelta }];
  }

  const raw = allocations.map((a) => ({
    pocketId: a.pocketId,
    rawAmount: (a.amount / totalOriginal) * totalDelta,
  }));

  const baseAmounts = raw.map((r) => Math.floor(r.rawAmount * 100) / 100);
  const remainders = raw.map((r, i) => r.rawAmount - baseAmounts[i]);
  const baseSum = baseAmounts.reduce((s, v) => s + v, 0);
  let remainder = Math.round((totalDelta - baseSum) * 100) / 100;

  const indexed = remainders.map((r, i) => ({ idx: i, remainder: r }));
  indexed.sort((a, b) => b.remainder - a.remainder);

  for (const item of indexed) {
    if (remainder <= 0) break;
    const add = Math.min(remainder, 0.01);
    baseAmounts[item.idx] = Math.round((baseAmounts[item.idx] + add) * 100) / 100;
    remainder = Math.round((remainder - add) * 100) / 100;
  }

  return baseAmounts.map((amount, i) => ({
    pocketId: allocations[i].pocketId,
    amount,
  }));
}
