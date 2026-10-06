import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function promotionOccursOnDate(menu, dateKey, date) {
  if (menu.type !== "Promotion" || !menu.activeStart || !menu.activeEnd) return false;
  if (dateKey < menu.activeStart || dateKey > menu.activeEnd) return false;
  const schedule = menu.promotionSchedule || {};
  if ((schedule.skippedDates || []).includes(dateKey)) return false;
  if ([0, 6].includes(date.getDay())) return false;
  if (schedule.mode !== "weekly") return true;
  return (schedule.weekdays || []).includes(date.getDay());
}

export default function PromotionCalendar({ menus = [], onOpenMenu, testId = "ssmt-promotion-calendar" }) {
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const scheduledPromotions = menus.filter((menu) => menu.type === "Promotion" && menu.activeStart && menu.activeEnd);
  const firstVisibleDate = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1 - visibleMonth.getDay());
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstVisibleDate);
    date.setDate(firstVisibleDate.getDate() + index);
    return date;
  });
  const localKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const changeMonth = (offset) => setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + offset, 1));

  return (
    <section data-testid={testId} className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-700">Promotion schedule</p>
          <h2 className="mt-1 text-2xl font-black text-slate-950">{visibleMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">Only Promotion menus with both a start and end date appear. Saturdays and Sundays are excluded.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100"><ChevronLeft size={18} /> Previous</button>
          <button type="button" aria-label="Next month" onClick={() => changeMonth(1)} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-black text-slate-800 hover:bg-slate-100">Next <ChevronRight size={18} /></button>
        </div>
      </div>
      <div className="mt-4 overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-7 overflow-hidden rounded-lg border border-slate-200">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => <div key={day} className="border-b border-slate-200 bg-slate-100 px-2 py-2 text-center text-xs font-black uppercase tracking-wide text-slate-600">{day}</div>)}
          {calendarDays.map((date) => {
            const key = localKey(date);
            const dayPromotions = scheduledPromotions.filter((menu) => promotionOccursOnDate(menu, key, date));
            const inMonth = date.getMonth() === visibleMonth.getMonth();
            const isToday = key === localKey(new Date());
            return (
              <div key={key} data-testid={`ssmt-calendar-day-${key}`} aria-current={isToday ? "date" : undefined} className={`min-h-28 border-b border-r border-slate-200 p-2 ${isToday ? "bg-purple-50 ring-1 ring-inset ring-purple-200" : inMonth ? "bg-white" : "bg-slate-50 text-slate-400"}`}>
                <span className="text-xs font-black">{date.getDate()}</span>
                <div className="mt-1 space-y-1">
                  {dayPromotions.map((menu) => onOpenMenu ? (
                    <button key={menu.id} type="button" onClick={() => onOpenMenu(menu.id)} className="block w-full rounded-md border border-purple-300 bg-purple-100 px-2 py-1 text-left text-[11px] font-black leading-4 text-purple-950 hover:border-purple-500 hover:bg-purple-200">{menu.name}</button>
                  ) : (
                    <div key={menu.id} className="rounded-md border border-purple-300 bg-purple-100 px-2 py-1 text-[11px] font-black leading-4 text-purple-950">{menu.name}</div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}