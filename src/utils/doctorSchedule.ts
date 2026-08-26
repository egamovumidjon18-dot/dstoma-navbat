// Shared weekly-schedule math for a doctor's working hours.
//
// This is the ONLY definition. DoctorDashboard's "Rejalashtirilgan" grid and the
// patient-facing availability view both import from here, so the two can never
// show a different picture of the same doctor's week. (They previously kept
// byte-identical copies of eight of these helpers, which had already drifted:
// the doctor's grid treated a cancelled appointment as still occupying its slot
// while the patient was told the same slot was free.)
import type { Doctor, QueueItem } from '../types';

export const DEFAULT_WORKING_HOURS = {
  startTime: '08:00',
  endTime: '18:00',
  slotMinutes: 60,
  lunchStart: '13:00',
  lunchEnd: '14:00',
  autoQueue: true,
  // Mon–Sat. Sunday off by default; a clinic can change this per doctor.
  workDays: [1, 2, 3, 4, 5, 6],
};

// A queue still occupies its slot unless it was cancelled. Used everywhere so
// "is this slot taken" has exactly one answer.
export const OCCUPIES_SLOT = (q: QueueItem) => q.status !== 'cancelled';

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

// A date as the calendar on the wall shows it, not as UTC does.
// `new Date().toISOString().slice(0, 10)` is a full day behind for the first
// five hours of every Tashkent morning, which is how the booking modal ended up
// defaulting to yesterday when opened late at night.
export function toDateKey(d: Date = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Monday-Sunday dates for the week `weekOffset` weeks from the current one (0 = this week).
export function getWeekDays(weekOffset: number): { date: string; dateObj: Date; weekday: string }[] {
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun..6=Sat
  const mondayOffset = jsDay === 0 ? -6 : 1 - jsDay;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + weekOffset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i);
    return { date: toDateKey(d), dateObj: d, weekday: WEEKDAY_NAMES_UZ[d.getDay()] };
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
      OCCUPIES_SLOT(q) &&
      getQueueSlot(q.appointmentTime, scheduleSlots) === slot
  );
}

// ---------------------------------------------------------------------------
// Working days
// ---------------------------------------------------------------------------

/** Day numbers the doctor works, JS convention (0=Sunday). */
export function getWorkDays(workingHours: WorkingHours): number[] {
  const days = (workingHours as any).workDays;
  if (!Array.isArray(days) || days.length === 0) return DEFAULT_WORKING_HOURS.workDays;
  return days;
}

/** `date` is "YYYY-MM-DD" or a Date. Days off are not bookable. */
export function isWorkingDay(date: string | Date, workingHours: WorkingHours): boolean {
  const d = typeof date === 'string' ? new Date(`${date}T00:00:00`) : date;
  if (isNaN(d.getTime())) return true; // never block on an unparseable date
  return getWorkDays(workingHours).includes(d.getDay());
}

// ---------------------------------------------------------------------------
// Out-of-hours detection
// ---------------------------------------------------------------------------

/**
 * True when an appointment time falls outside the doctor's configured day.
 *
 * getQueueSlot deliberately CLAMPS such times onto the first/last slot so they
 * still render somewhere; without this check a 19:00 appointment silently
 * appears under the 17:00 row and the row header lies about when it is.
 */
export function isOutOfHours(appointmentTime: string | undefined, workingHours: WorkingHours): boolean {
  if (!appointmentTime) return false;
  const m = timeToMinutes(appointmentTime);
  if (isNaN(m)) return false;
  return m < timeToMinutes(workingHours.startTime) || m >= timeToMinutes(workingHours.endTime);
}

// ---------------------------------------------------------------------------
// Conflicts
// ---------------------------------------------------------------------------

/**
 * The appointment already occupying this doctor's date+slot, if any.
 *
 * `excludeQueueId` lets an edit re-save into its own slot without colliding
 * with itself. Returns the clashing item so the caller can name it in the
 * message rather than just refusing.
 */
export function findConflict(
  queues: QueueItem[],
  doctorId: string,
  date: string,
  time: string,
  workingHours: WorkingHours,
  excludeQueueId?: string,
): QueueItem | null {
  if (!doctorId || !date || !time) return null;
  const slots = getScheduleSlots(workingHours);
  const targetSlot = getQueueSlot(time, slots);
  if (!targetSlot) return null;
  return (
    queues.find(
      (q) =>
        q.id !== excludeQueueId &&
        q.doctorId === doctorId &&
        q.appointmentDate === date &&
        OCCUPIES_SLOT(q) &&
        getQueueSlot(q.appointmentTime, slots) === targetSlot,
    ) || null
  );
}
