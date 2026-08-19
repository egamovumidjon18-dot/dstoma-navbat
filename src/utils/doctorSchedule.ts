// Shared weekly-schedule math for a doctor's working hours — used by both
// DoctorDashboard's "Rejalashtirilgan" grid and the patient-facing
// availability view, so the two can never show a different picture of the
// same doctor's week. Algorithm mirrors DoctorDashboard.tsx's local
// scheduleSlots/isLunchSlot/getQueueSlot logic exactly.
import type { Doctor, QueueItem } from '../types';

export const DEFAULT_WORKING_HOURS = {
  startTime: '08:00',
  endTime: '18:00',
  slotMinutes: 60,
  lunchStart: '13:00',
  lunchEnd: '14:00',
  autoQueue: true,
};

export type WorkingHours = NonNullable<Doctor['workingHours']>;

export const WEEKDAY_NAMES_UZ = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

export function getDoctorWorkingHours(doctor?: Doctor | null): WorkingHours {
  return doctor?.workingHours || DEFAULT_WORKING_HOURS;
}

export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(mins: number): string {
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;
}

// "HH:MM" slots from startTime up to (not including) endTime, stepped by slotMinutes.
export function getScheduleSlots(workingHours: WorkingHours): string[] {
  const startMin = timeToMinutes(workingHours.startTime);
  const endMin = timeToMinutes(workingHours.endTime);
  const step = workingHours.slotMinutes || 60;
  const slots: string[] = [];
  for (let m = startMin; m < endMin; m += step) slots.push(minutesToTime(m));
  return slots;
}

export function isLunchSlot(slotTime: string, workingHours: WorkingHours): boolean {
  if (!workingHours.lunchStart || !workingHours.lunchEnd) return false;
  const m = timeToMinutes(slotTime);
  return m >= timeToMinutes(workingHours.lunchStart) && m < timeToMinutes(workingHours.lunchEnd);
}

// A queue item belongs to a slot if its appointmentTime falls anywhere within
// [slot, nextSlot) — same range-match rule the doctor's grid uses.
export function getQueueSlot(appointmentTime: string | undefined, scheduleSlots: string[]): string | null {
  if (!appointmentTime || scheduleSlots.length === 0) return null;
  const m = timeToMinutes(appointmentTime);
  if (m < timeToMinutes(scheduleSlots[0])) return scheduleSlots[0];
  let match: string = scheduleSlots[0];
  for (const slot of scheduleSlots) {
    if (m >= timeToMinutes(slot)) match = slot;
    else break;
  }
  return match;
}

// Monday-Sunday dates for the week `weekOffset` weeks from the current one (0 = this week).
export function getWeekDays(weekOffset: number): { date: string; dateObj: Date; weekday: string }[] {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return { date: dateStr, dateObj: d, weekday: WEEKDAY_NAMES_UZ[d.getDay()] };
  });
}

// Whether a doctor has any non-cancelled appointment landing in this exact date+slot.
export function isSlotBooked(
  queues: QueueItem[],
  doctorId: string,
  date: string,
  slot: string,
  scheduleSlots: string[]
): boolean {
  return queues.some(
    (q) =>
      q.doctorId === doctorId &&
      q.appointmentDate === date &&
      q.status !== 'cancelled' &&
      getQueueSlot(q.appointmentTime, scheduleSlots) === slot
  );
}
