// Port of prototipe/api/app/messages.py: system text that lands in the public timeline (QA-P01 D7). Russian, numbers from SETTINGS.
import { SETTINGS } from "./config";

export function ruPlural(count: number, one: string, few: string, many: string): string {
  const tail = Math.abs(count) % 100;
  if (tail >= 11 && tail <= 14) return many;
  const last = tail % 10;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

export function closingByConfirmations(): string {
  const n = SETTINGS.closingConfirmations;
  return `Правило закрытия: ${n} ${ruPlural(n, "подтверждение", "подтверждения", "подтверждений")} от жителей, кроме исполнителя`;
}

export function closingByDays(): string {
  const n = SETTINGS.closingDaysWithoutDispute;
  return `Правило закрытия: ${n} ${ruPlural(n, "день", "дня", "дней")} без спора`;
}

export function claimReleased(): string {
  return `Заявка снята: истёк срок удержания (${SETTINGS.claimHoldHours} ч)`;
}
