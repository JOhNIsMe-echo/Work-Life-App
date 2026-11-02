import { useLiveQuery } from "dexie-react-hooks";
import { ChevronLeft, ChevronRight, Plus, Utensils } from "lucide-react";
import { useState } from "react";
import { addDays, format, parseISO, startOfMonth } from "date-fns";
import { Button } from "../../components/Button/Button";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import {
  RecordCalendar,
  type CalendarMarker,
} from "../../components/RecordCalendar/RecordCalendar";
import { useToast } from "../../components/Toast/ToastContext";
import { repositories } from "../../data/repositories";
import { todayKey } from "../../domain/dates";
import type { DietEntry, LocalDate, MealType } from "../../domain/types";
import { DietEditor } from "./DietEditor";
import styles from "./DietPage.module.css";

const MEALS: Array<{
  value: MealType;
  label: string;
  helper: string;
}> = [
  { value: "breakfast", label: "早餐", helper: "开启一天" },
  { value: "lunch", label: "午餐", helper: "中午吃了什么" },
  { value: "dinner", label: "晚餐", helper: "晚上吃了什么" },
  { value: "snack", label: "加餐", helper: "水果、饮料或小零食" },
];

const currency = new Intl.NumberFormat("zh-CN", {
  style: "currency",
  currency: "CNY",
  minimumFractionDigits: 2,
});
const fullDateFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

type EditorState = {
  entry: DietEntry | null;
  meal: MealType;
} | null;

export function DietDashboard() {
  const { notify, notifyUndo } = useToast();
  const [date, setDate] = useState<LocalDate>(todayKey());
  const [month, setMonth] = useState(() => startOfMonth(new Date()));
  const [editor, setEditor] = useState<EditorState>(null);
  const allEntries = useLiveQuery(() => repositories.diet.list(), [], []);
  const entries = allEntries
    .filter((entry) => entry.date === date)
    .toSorted((left, right) =>
      (right.recordedAt ?? right.createdAt).localeCompare(
        left.recordedAt ?? left.createdAt,
      ),
    );
  const recordedMeals = new Set(entries.map((entry) => entry.meal));
  const totalPrice = entries.reduce((total, entry) => total + (entry.price ?? 0), 0);
  const isToday = date === todayKey();
  const markers = allEntries.reduce<Partial<Record<LocalDate, CalendarMarker>>>(
    (result, entry) => {
      const marker = result[entry.date] ?? {
        count: 0,
        value: 0,
        detail: "",
      };
      marker.count += 1;
      marker.value += entry.price ?? 0;
      marker.detail = `${marker.count} 项 · ${currency.format(marker.value)}`;
      result[entry.date] = marker;
      return result;
    },
    {},
  );

  function moveDate(days: number) {
    const next = addDays(parseISO(date), days);
    const nextKey = format(next, "yyyy-MM-dd") as LocalDate;
    if (nextKey <= todayKey()) {
      setDate(nextKey);
      setMonth(startOfMonth(next));
    }
  }

  function openEditor(meal: MealType, entry?: DietEntry) {
    setEditor({ meal, entry: entry ?? null });
  }

  async function remove(entry: DietEntry) {
    try {
      const removed = await repositories.diet.remove(entry.id);
      setEditor(null);
      if (removed) {
        notifyUndo("饮食记录已删除", {
          label: "撤销",
          onAction: async () => {
            await repositories.diet.restore(removed);
          },
        });
      }
    } catch {
      notify("删除失败，请重试");
    }
  }

  return (
    <>
      <PageHeader
        eyebrow={`${isToday ? "今天" : format(parseISO(date), "M月d日")}已记录 ${
          recordedMeals.size
        } / 4 餐`}
        title="饮食记录"
        description="按一天的四餐记录吃过什么，不需要把每一口都算成数字。"
        action={
          <Button variant="primary" onClick={() => openEditor("lunch")}>
            <Plus size={16} aria-hidden="true" />
            添加食物
          </Button>
        }
      />

      <div className={styles.dayOverview}>
        <div className={styles.dateSwitcher}>
          <Button
            size="sm"
            variant="ghost"
            aria-label="前一天"
            onClick={() => moveDate(-1)}
          >
            <ChevronLeft size={16} aria-hidden="true" />
          </Button>
          <div>
            <strong>{isToday ? "今天" : format(parseISO(date), "M月d日")}</strong>
            <small>{fullDateFormatter.format(parseISO(date))}</small>
          </div>
          <Button
            size="sm"
            variant="ghost"
            aria-label="后一天"
            disabled={isToday}
            onClick={() => moveDate(1)}
          >
            <ChevronRight size={16} aria-hidden="true" />
          </Button>
        </div>
        <div className={styles.dayMetrics}>
          <article>
            <span>已记录餐次</span>
            <strong>{recordedMeals.size} / 4</strong>
          </article>
          <article>
            <span>食物条目</span>
            <strong>{entries.length}</strong>
          </article>
          <article>
            <span>当日花费</span>
            <strong>{currency.format(totalPrice)}</strong>
          </article>
        </div>
      </div>

      <div className={styles.workspace}>
        <RecordCalendar
          ariaLabel="饮食记录日历"
          month={month}
          selectedDate={date}
          maxDate={todayKey()}
          markers={markers}
          onMonthChange={setMonth}
          onSelectDate={(next) => {
            setDate(next);
            setMonth(startOfMonth(parseISO(next)));
          }}
        />
        <div className={styles.mealGrid}>
          {MEALS.map((meal) => {
            const mealEntries = entries.filter((entry) => entry.meal === meal.value);
            const mealTotal = mealEntries.reduce(
              (total, entry) => total + (entry.price ?? 0),
              0,
            );
            return (
              <article
                key={meal.value}
                className={`${styles.mealCard} ${
                  mealEntries.length > 0 ? styles.hasRecords : ""
                }`}
              >
                <div className={styles.mealHead}>
                  <div>
                    <span>{meal.helper}</span>
                    <h2>{meal.label}</h2>
                  </div>
                  <div className={styles.mealActions}>
                    {mealEntries.length > 0 ? (
                      <strong>{currency.format(mealTotal)}</strong>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEditor(meal.value)}
                    >
                      添加
                    </Button>
                  </div>
                </div>
                {mealEntries.length === 0 ? (
                  <button
                    type="button"
                    className={styles.emptyMeal}
                    onClick={() => openEditor(meal.value)}
                  >
                    <Utensils size={16} aria-hidden="true" />
                    还没有记录{meal.label}
                  </button>
                ) : (
                  <div className={styles.foodList}>
                    {mealEntries.map((entry) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={styles.foodRow}
                        onClick={() => openEditor(meal.value, entry)}
                      >
                        <span className={styles.foodDot} aria-hidden="true" />
                        <span className={styles.foodCopy}>
                          <strong>{entry.food}</strong>
                          <small>
                            {entry.portion || "份量未记录"}
                            {entry.notes ? ` · ${entry.notes}` : ""}
                          </small>
                        </span>
                        <b className={styles.foodPrice}>
                          {entry.price === undefined
                            ? "未记价格"
                            : currency.format(entry.price)}
                        </b>
                      </button>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </div>

      {editor ? (
        <DietEditor
          key={editor.entry?.id ?? `${date}-${editor.meal}`}
          open
          entry={editor.entry}
          defaultMeal={editor.meal}
          defaultDate={date}
          onClose={() => setEditor(null)}
          onDelete={remove}
        />
      ) : null}
    </>
  );
}
