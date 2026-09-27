"use client";

import { CalendarRange, CalendarCheck2, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Modal } from "@/shared/components/Modal";
import { formatDate, isSameDay, startOfDay } from "@/shared/lib/dates";
import { customDaysRange, customRange, type DateRange } from "../types";

type Mode = "range" | "days";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface Props {
  open: boolean;
  initial?: DateRange;
  onClose: () => void;
  onApply: (range: DateRange) => void;
}

export function CustomDatePicker(props: Props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Custom dates">
      {props.open && <PickerBody {...props} />}
    </Modal>
  );
}

function PickerBody({ initial, onClose, onApply }: Props) {
  const hasDays = !!initial?.selectedDays?.length;
  const isCustomRange = initial?.preset === "custom" && !hasDays;
  const [mode, setMode] = useState<Mode>(hasDays ? "days" : "range");
  const [days, setDays] = useState<Date[]>(hasDays ? initial!.selectedDays! : []);
  const [rangeStart, setRangeStart] = useState<Date | null>(isCustomRange ? startOfDay(initial!.start) : null);
  const [rangeEnd, setRangeEnd] = useState<Date | null>(isCustomRange ? startOfDay(initial!.end) : null);
  const anchor = days[0] ?? rangeStart ?? new Date();
  const [visible, setVisible] = useState(new Date(anchor.getFullYear(), anchor.getMonth(), 1));

  const switchMode = (next: Mode) => {
    setMode(next);
    setDays([]);
    setRangeStart(null);
    setRangeEnd(null);
  };

  const onDay = (day: Date) => {
    if (mode === "days") {
      setDays((list) =>
        list.some((d) => isSameDay(d, day)) ? list.filter((d) => !isSameDay(d, day)) : [...list, day],
      );
    } else if (!rangeStart || rangeEnd) {
      setRangeStart(day);
      setRangeEnd(null);
    } else {
      setRangeEnd(day);
    }
  };

  const [lo, hi] =
    rangeStart && rangeEnd ? (rangeStart <= rangeEnd ? [rangeStart, rangeEnd] : [rangeEnd, rangeStart]) : [null, null];

  const isSelected = (day: Date) => {
    if (mode === "days") return days.some((d) => isSameDay(d, day));
    if (rangeStart && !rangeEnd) return isSameDay(rangeStart, day);
    return !!lo && !!hi && day >= lo && day <= hi;
  };
  const isEdge = (day: Date) =>
    mode === "days" || (!!rangeStart && isSameDay(rangeStart, day)) || (!!rangeEnd && isSameDay(rangeEnd, day));

  const summary = (() => {
    if (mode === "days") {
      if (days.length === 0) return "Tap days to select";
      const sorted = [...days].sort((a, b) => a.getTime() - b.getTime());
      return sorted.length <= 3 ? sorted.map((d) => formatDate(d, "d MMM")).join(", ") : `${sorted.length} days selected`;
    }
    if (!rangeStart) return "Tap start date";
    if (!rangeEnd) return `Start: ${formatDate(rangeStart, "d MMM")} · tap end date`;
    return `${formatDate(lo!, "d MMM")} → ${formatDate(hi!, "d MMM")}`;
  })();

  const canApply = mode === "days" ? days.length > 0 : !!rangeStart && !!rangeEnd;
  const apply = () => {
    if (!canApply) return;
    onApply(mode === "days" ? customDaysRange(days) : customRange(rangeStart!, rangeEnd!));
  };

  const year = visible.getFullYear();
  const month = visible.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const leading = (new Date(year, month, 1).getDay() + 6) % 7;
  const today = new Date();

  const segment = (value: Mode, label: string, Icon: typeof CalendarRange) => (
    <button
      type="button"
      onClick={() => switchMode(value)}
      aria-pressed={mode === value}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        mode === value ? "bg-surface text-primary shadow-card" : "text-muted"
      }`}
    >
      <Icon className="size-4" /> {label}
    </button>
  );

  return (
    <div>
      <div className="flex gap-1 rounded-xl bg-surface-container p-1">
        {segment("range", "Range", CalendarRange)}
        {segment("days", "Pick days", CalendarCheck2)}
      </div>
      <p className="mt-2 text-center text-sm text-muted">
        {mode === "range" ? "Tap a start day, then an end day" : "Tap any days (e.g. 5 May, 12 May, 15 May)"}
      </p>

      <div className="mt-3 flex items-center">
        <button type="button" aria-label="Previous month" onClick={() => setVisible(new Date(year, month - 1, 1))} className="grid size-9 place-items-center rounded-full hover:bg-surface-container">
          <ChevronLeft className="size-5" />
        </button>
        <p className="flex-1 text-center font-semibold">{formatDate(visible, "MMMM yyyy")}</p>
        <button type="button" aria-label="Next month" onClick={() => setVisible(new Date(year, month + 1, 1))} className="grid size-9 place-items-center rounded-full hover:bg-surface-container">
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1 text-center font-mono text-[11px] text-muted">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>
      <div className="mt-1 grid grid-cols-7 gap-1">
        {Array.from({ length: leading }, (_, i) => <span key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = new Date(year, month, i + 1);
          const selected = isSelected(day);
          const strong = selected && isEdge(day);
          return (
            <button
              key={i}
              type="button"
              onClick={() => onDay(day)}
              className={`aspect-square rounded-xl text-sm transition ${
                strong
                  ? "bg-primary-strong font-bold text-on-primary"
                  : selected
                    ? "bg-primary-strong/35 font-semibold"
                    : isSameDay(day, today)
                      ? "border border-primary hover:bg-surface-container"
                      : "hover:bg-surface-container"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center font-semibold">{summary}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={onClose} className="rounded-xl border border-line px-4 py-3 font-semibold hover:bg-surface-container">
          Cancel
        </button>
        <button type="button" disabled={!canApply} onClick={apply} className="rounded-xl bg-primary-strong px-4 py-3 font-semibold text-on-primary transition hover:brightness-110 disabled:opacity-50">
          Apply
        </button>
      </div>
    </div>
  );
}
