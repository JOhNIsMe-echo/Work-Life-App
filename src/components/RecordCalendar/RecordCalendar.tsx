import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isSameDay,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LocalDate } from "../../domain/types";
import styles from "./RecordCalendar.module.css";

export type CalendarMarker = {
  count: number;
  value: number;
  detail: string;
};

type RecordCalendarProps = {
  ariaLabel: string;
  month: Date;
  selectedDate: LocalDate;
  maxDate?: LocalDate;
  markers: Partial<Record<LocalDate, CalendarMarker>>;
  onMonthChange: (month: Date) => void;
  onSelectDate: (date: LocalDate) => void;
};

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function dateKey(date: Date): LocalDate {
  return format(date, "yyyy-MM-dd") as LocalDate;
}

export function RecordCalendar({
  ariaLabel,
  month,
  selectedDate,
  maxDate,
  markers,
  onMonthChange,
  onSelectDate,
}: RecordCalendarProps) {
  const monthStart = startOfMonth(month);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const maximumMonth = maxDate ? startOfMonth(parseISO(maxDate)) : null;
  const nextDisabled = maximumMonth !== null && !isAfter(maximumMonth, monthStart);

  return (
    <section className={styles.calendar} aria-label={ariaLabel}>
      <header className={styles.header}>
        <button
          type="button"
          className={styles.navButton}
          aria-label="上一个月"
          onClick={() => onMonthChange(addMonths(monthStart, -1))}
        >
          <ChevronLeft size={15} aria-hidden="true" />
        </button>
        <div>
          <strong>{format(monthStart, "yyyy年 M月", { locale: zhCN })}</strong>
          <small>记录日历</small>
        </div>
        <button
          type="button"
          className={styles.navButton}
          aria-label="下一个月"
          disabled={nextDisabled}
          onClick={() => onMonthChange(addMonths(monthStart, 1))}
        >
          <ChevronRight size={15} aria-hidden="true" />
        </button>
      </header>

      <div className={styles.weekdays} aria-hidden="true">
        {WEEKDAYS.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className={styles.grid}>
        {days.map((day) => {
          const key = dateKey(day);
          const inMonth = day.getMonth() === monthStart.getMonth();
          const disabled = !inMonth || (maxDate !== undefined && key > maxDate);

          if (!inMonth) {
            return <span key={key} className={styles.blank} />;
          }

          const marker = markers[key];
          const selected = key === selectedDate;
          const isToday = isSameDay(day, new Date());
          return (
            <button
              key={key}
              type="button"
              className={`${styles.day} ${selected ? styles.selected : ""} ${
                isToday ? styles.today : ""
              }`}
              disabled={disabled}
              aria-label={`${format(day, "M月d日", { locale: zhCN })}，${
                marker?.detail ?? "没有记录"
              }`}
              aria-pressed={selected}
              onClick={() => onSelectDate(key)}
            >
              <span>{format(day, "d")}</span>
              {marker ? (
                <>
                  <i aria-hidden="true" />
                  <small>{marker.count}</small>
                </>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
