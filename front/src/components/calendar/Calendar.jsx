// src/components/calendar/Calendar.jsx
import { useMemo } from "react";

function pad2(n) {
  return String(n).padStart(2, "0");
}
function toISODate(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}
function endOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}
function addMonths(date, diff) {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}
function startOfWeekSunday(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0(Sun)~6
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function Calendar({
  value, // Date
  onChange, // (Date) => void
  month, // Date (해당 월)
  onMonthChange, // (Date) => void
  marks = new Set(), // Set<YYYY-MM-DD> : todo 있는 날짜 표시용
  compact = false, // 왼쪽 date input 팝업용
}) {
  const monthStart = useMemo(() => startOfMonth(month), [month]);
  const monthEnd = useMemo(() => endOfMonth(month), [month]);

  const gridStart = useMemo(() => startOfWeekSunday(monthStart), [monthStart]);

  const days = useMemo(() => {
    const arr = [];
    const cur = new Date(gridStart);
    for (let i = 0; i < 42; i++) {
      arr.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return arr;
  }, [gridStart]);

  const title = useMemo(() => {
    return month.toLocaleString("en-US", { month: "long", year: "numeric" });
  }, [month]);

  const weekNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

  return (
    <div className={`cal ${compact ? "cal--compact" : ""}`}>
      <div className="cal__header">
        <button
          type="button"
          className="cal__nav"
          onClick={() => onMonthChange(addMonths(month, -1))}
          aria-label="prev month"
        >
          ‹
        </button>
        <div className="cal__title">{title}</div>
        <button
          type="button"
          className="cal__nav"
          onClick={() => onMonthChange(addMonths(month, 1))}
          aria-label="next month"
        >
          ›
        </button>
      </div>

      <div className="cal__week">
        {weekNames.map((w) => (
          <div key={w} className="cal__weekDay">
            {w}
          </div>
        ))}
      </div>

      <div className="cal__grid">
        {days.map((d) => {
          const iso = toISODate(d);
          const inMonth =
            d.getMonth() === monthStart.getMonth() &&
            d.getFullYear() === monthStart.getFullYear();

          const selected = isSameDay(d, value);
          const hasTodo = marks?.has?.(iso);

          return (
            <button
              type="button"
              key={iso}
              className={[
                "cal__cell",
                inMonth ? "is-inMonth" : "is-outMonth",
                selected ? "is-selected" : "",
                hasTodo ? "has-todo" : "",
                d.getDay() === 0 ? "is-sun" : "",
                d.getDay() === 6 ? "is-sat" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onChange(new Date(d))}
            >
              <span className="cal__day">{d.getDate()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
