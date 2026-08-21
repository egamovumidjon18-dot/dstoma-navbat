import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react';
import { Doctor, QueueItem } from '../types';
import {
  getDoctorWorkingHours,
  getScheduleSlots,
  isLunchSlot,
  isSlotBooked,
  getWeekDays,
} from '../utils/doctorSchedule';

// Read-only weekly free/busy view for a doctor, shown to a patient while
// booking so they can see which days/times are actually open before
// confirming. Uses the exact same working-hours/slot/lunch math as
// DoctorDashboard's "Rejalashtirilgan" grid over the same live doctors/queues
// data — so it can never disagree with what the doctor sees on their side.
export default function DoctorAvailability({
  doctor,
  queues,
  t,
  onJoinWaitlist,
}: {
  doctor: Doctor;
  queues: QueueItem[];
  t: (s: string) => string;
  onJoinWaitlist?: (doctorId: string) => void;
}) {
  const [weekOffset, setWeekOffset] = useState(0);

  const workingHours = getDoctorWorkingHours(doctor);
  const scheduleSlots = getScheduleSlots(workingHours);
  const weekDays = getWeekDays(weekOffset);

  const formatDdMm = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}`;
  const weekLabel = `${formatDdMm(weekDays[0].dateObj)} — ${formatDdMm(weekDays[6].dateObj)}`;
  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/60 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-1.5 min-w-0">
          <CalendarClock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <p className="text-[11px] font-black text-slate-600 uppercase tracking-wide truncate">
            {t('shifokorning bandligi')}
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v - 1)}
            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-black text-slate-500 px-1 min-w-[70px] text-center">{weekLabel}</span>
          <button
            type="button"
            onClick={() => setWeekOffset((v) => v + 1)}
            className="p-1 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-lg transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-center">
          <thead>
            <tr>
              <th className="w-14 px-1 py-1.5 border-b border-r border-slate-200 bg-slate-50 sticky left-0"></th>
              {weekDays.map((day) => (
                <th
                  key={day.date}
                  className={`px-1 py-1.5 border-b border-r border-slate-200 last:border-r-0 ${
                    day.date === todayStr ? 'bg-blue-600 text-white' : 'bg-slate-50 text-slate-600'
                  }`}
                >
                  <p className="text-[8px] font-black uppercase tracking-wide">{t(day.weekday.toLowerCase())}</p>
                  <p className="text-[10px] font-black">{formatDdMm(day.dateObj)}</p>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scheduleSlots.map((slot) => {
              const lunch = isLunchSlot(slot, workingHours);
              return (
                <tr key={slot}>
                  <td className="w-14 px-1 py-1 border-b border-r border-slate-200 bg-slate-50/60 text-[9px] font-black text-slate-500 sticky left-0">
                    {slot}
                  </td>
                  {weekDays.map((day) => {
                    const booked = !lunch && isSlotBooked(queues, doctor.id, day.date, slot, scheduleSlots);
                    return (
                      <td key={day.date} className="p-0.5 border-b border-r border-slate-200 last:border-r-0">
                        {lunch ? (
                          <div className="h-5 rounded bg-slate-100 flex items-center justify-center">
                            <span className="text-[7px] font-black text-slate-300 uppercase">{t('tushlik')}</span>
                          </div>
                        ) : (
                          <div
                            className={`h-5 rounded flex items-center justify-center ${
                              booked ? 'bg-rose-100' : 'bg-emerald-100'
                            }`}
                            title={booked ? t('band') : t("bo'sh")}
                          >
                            <span className={`text-[7px] font-black uppercase ${booked ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {booked ? t('band') : t("bo'sh")}
                            </span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-4 px-3 py-2 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-100 border border-emerald-200"></span>
          <span className="text-[9px] font-bold text-slate-500">{t("bo'sh")}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-100 border border-rose-200"></span>
          <span className="text-[9px] font-bold text-slate-500">{t('band')}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-slate-100 border border-slate-200"></span>
          <span className="text-[9px] font-bold text-slate-500">{t('tushlik')}</span>
        </div>
        {onJoinWaitlist && (
          <button
            type="button"
            onClick={() => onJoinWaitlist(doctor.id)}
            className="ml-auto text-[10px] font-black text-purple-600 hover:text-purple-700 hover:underline"
          >
            🔔 {t("navbat bo'shasa, xabar bering")}
          </button>
        )}
      </div>
    </div>
  );
}
