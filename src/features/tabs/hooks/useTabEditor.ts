"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DailyTab } from "../types";
import { autoSaveTab, saveTabTitle } from "./tabUseCases";

const NOTES_DEBOUNCE_MS = 700;
const NOTES_NEWLINE_DEBOUNCE_MS = 200;
const TITLE_DEBOUNCE_MS = 400;

/** Local draft of notes + title with debounced autosave and flush-on-leave. */
export function useTabEditor(initial: DailyTab) {
  const tabId = initial.id;
  const [notes, setNotesState] = useState(initial.notesText);
  const [title, setTitleState] = useState(initial.customTitle);
  const [savedTick, setSavedTick] = useState(0);
  /** The unique title that was actually saved, when it differs from what's typed. */
  const [titleConflict, setTitleConflict] = useState<string | null>(null);

  const notesRef = useRef(initial.notesText);
  const titleRef = useRef(initial.customTitle);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (notesTimer.current) clearTimeout(notesTimer.current);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    autoSaveTab(tabId, notesRef.current, titleRef.current);
  }, [tabId]);

  useEffect(() => {
    const onHide = () => document.visibilityState === "hidden" && flush();
    document.addEventListener("visibilitychange", onHide);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", onHide);
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [flush]);

  const setNotes = (value: string) => {
    notesRef.current = value;
    setNotesState(value);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(
      () => {
        autoSaveTab(tabId, notesRef.current, titleRef.current);
        setSavedTick((t) => t + 1);
      },
      value.endsWith("\n") ? NOTES_NEWLINE_DEBOUNCE_MS : NOTES_DEBOUNCE_MS,
    );
  };

  const setTitle = (value: string) => {
    titleRef.current = value;
    setTitleState(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    titleTimer.current = setTimeout(() => {
      titleTimer.current = null;
      const saved = saveTabTitle(tabId, titleRef.current);
      setTitleConflict(saved !== titleRef.current.trim() ? saved : null);
      setSavedTick((t) => t + 1);
    }, TITLE_DEBOUNCE_MS);
  };

  /** Called on blur: adopt the unique title so the input matches what's stored. */
  const commitTitle = (): string | null => {
    let saved = titleConflict;
    if (titleTimer.current) {
      clearTimeout(titleTimer.current);
      titleTimer.current = null;
      saved = saveTabTitle(tabId, titleRef.current);
      setSavedTick((t) => t + 1);
    }
    setTitleConflict(null);
    if (!saved || saved === titleRef.current.trim()) return null;
    titleRef.current = saved;
    setTitleState(saved);
    return saved;
  };

  return { notes, title, titleConflict, savedTick, setNotes, setTitle, commitTitle, flush };
}
