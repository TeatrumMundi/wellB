import { Component, signal, ElementRef, ViewChild, OnInit } from '@angular/core';
import { MEDITATION_VIDEOS } from './meditation-videos';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { FormsModule } from '@angular/forms';
// Angular Material modules used by the modal inputs
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, FormsModule, CommonModule, MatFormFieldModule, MatInputModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('wellB');
  protected readonly calendarDays = signal<(CalendarDay | null)[]>([]);
  protected readonly calendarWeeks = signal<(CalendarDay | null)[][]>([]);
  // Currently displayed month (Date set to first day of month)
  protected readonly displayedMonth = signal<Date>(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );

  @ViewChild('contentSection') contentSection!: ElementRef;
  @ViewChild('meditationRow') meditationRow!: ElementRef;

  // Videos list imported from editable file
  protected meditationVideos = MEDITATION_VIDEOS;

  // Selected day for the editor modal
  protected selectedDay: CalendarDay | null = null;

  // Default goals
  private readonly DEFAULT_STEPS_GOAL = 10000;
  private readonly DEFAULT_WATER_GOAL = 2; // liters

  // Editing model bound to the modal inputs
  protected editingData = {
    steps: 0,
    stepsGoal: this.DEFAULT_STEPS_GOAL,
    water: 0,
    waterGoal: this.DEFAULT_WATER_GOAL,
  };

  // In-memory map of daily data keyed by YYYY-MM-DD, persisted to localStorage
  private dailyData = new Map<string, WellnessData>();

  private readonly STORAGE_KEY = 'wellb_daily_data_v1';

  ngOnInit() {
    this.refreshCalendar();
    this.loadFromStorage();
  }

  /** Refresh calendar based on displayedMonth signal */
  protected refreshCalendar() {
    const days = this.generateCalendarDays(this.displayedMonth());
    this.calendarDays.set(days);
    this.calendarWeeks.set(this.organizeIntoWeeks(days));
  }

  scrollToContent() {
    this.contentSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  // Scroll meditation thumbnails row left/right by viewport amount
  protected scrollMeditationLeft() {
    if (!this.meditationRow) return;
    const meditationRowElement = this.meditationRow.nativeElement as HTMLElement;
    meditationRowElement.scrollBy({ left: -Math.min(meditationRowElement.clientWidth, 400), behavior: 'smooth' });
  }

  protected scrollMeditationRight() {
    if (!this.meditationRow) return;
    const meditationRowElement = this.meditationRow.nativeElement as HTMLElement;
    meditationRowElement.scrollBy({ left: Math.min(meditationRowElement.clientWidth, 400), behavior: 'smooth' });
  }

  getCurrentMonthYear(): string {
    const now = this.displayedMonth();
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    return `${monthNames[now.getMonth()]} ${now.getFullYear()}`;
  }

  private generateCalendarDays(baseDate?: Date): (CalendarDay | null)[] {
    const now = baseDate ? new Date(baseDate) : new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of the current month
    const firstDay = new Date(year, month, 1);
    // Last day of the current month
    const lastDay = new Date(year, month + 1, 0);

    const firstDayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 7 for Monday-based week calculation
    const mondayBasedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    const padCount = mondayBasedFirstDay - 1; // number of leading blanks before the 1st

    const days: (CalendarDay | null)[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add leading nulls for days before the first of the month
    for (let i = 0; i < padCount; i++) {
      days.push(null);
    }

    // Add current month days
    for (let date = new Date(firstDay); date <= lastDay; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      days.push({
        day: date.getDate(),
        date: new Date(date),
        isCurrentMonth: true,
        isToday: currentDate.getTime() === today.getTime(),
      });
    }

    return days;
  }

  protected prevMonth() {
    const curr = this.displayedMonth();
    const prev = new Date(curr.getFullYear(), curr.getMonth() - 1, 1);
    this.displayedMonth.set(prev);
    this.refreshCalendar();
  }

  protected nextMonth() {
    const curr = this.displayedMonth();
    const next = new Date(curr.getFullYear(), curr.getMonth() + 1, 1);
    this.displayedMonth.set(next);
    this.refreshCalendar();
  }

  getCalendarDays(): (CalendarDay | null)[] {
    return this.calendarDays();
  }

  private organizeIntoWeeks(days: (CalendarDay | null)[]): (CalendarDay | null)[][] {
    const weeks: (CalendarDay | null)[][] = [];

    // Fill the first week with previous month days if needed
    let currentWeek: (CalendarDay | null)[] = [];

    // Process all days
    for (let i = 0; i < days.length; i++) {
      currentWeek.push(days[i]);

      // If we've filled 7 days, start a new week
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }

    // Handle the last partial week by filling with nulls
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return weeks;
  }

  getCalendarWeeks(): (CalendarDay | null)[][] {
    return this.calendarWeeks();
  }

  // --- Data persistence & editor helpers ---

  private loadFromStorage() {
    if (!this.isBrowser()) return;
    try {
      const raw = window.localStorage.getItem(this.STORAGE_KEY);
      if (raw) {
        const obj = JSON.parse(raw) as Record<string, WellnessData>;
        this.dailyData.clear();
        for (const k of Object.keys(obj)) {
          this.dailyData.set(k, obj[k]);
        }
      }
    } catch (e) {
      // ignore parse errors
      console.error('Failed to load daily data', e);
    }
  }

  private persistToStorage() {
    if (!this.isBrowser()) return;
    const obj: Record<string, WellnessData> = {};
    for (const [k, v] of this.dailyData.entries()) obj[k] = v;
    try {
      window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
      console.error('Failed to persist daily data', e);
    }
  }

  private isBrowser() {
    return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
  }

  protected onDayClick(day: CalendarDay | null) {
    if (!day) return;
    // Open editor for this day
    this.selectedDay = day;
    const key = this.getDateKey(day.date);
    const data = this.dailyData.get(key);
    if (data) {
      this.editingData = {
        steps: data.steps ?? 0,
        stepsGoal: data.stepsGoal ?? this.DEFAULT_STEPS_GOAL,
        water: data.water ?? 0,
        waterGoal: data.waterGoal ?? this.DEFAULT_WATER_GOAL,
      };
    } else {
      this.editingData = {
        steps: 0,
        stepsGoal: this.DEFAULT_STEPS_GOAL,
        water: 0,
        waterGoal: this.DEFAULT_WATER_GOAL,
      };
    }
  }

  protected closeEditor() {
    this.selectedDay = null;
    this.editingData = {
      steps: 0,
      stepsGoal: this.DEFAULT_STEPS_GOAL,
      water: 0,
      waterGoal: this.DEFAULT_WATER_GOAL,
    };
  }

  protected saveData() {
    if (!this.selectedDay) return;
    const key = this.getDateKey(this.selectedDay.date);
    const payload: WellnessData = {
      steps: Number(this.editingData.steps) || 0,
      stepsGoal: Number(this.editingData.stepsGoal) || this.DEFAULT_STEPS_GOAL,
      water: Number(this.editingData.water) || 0,
      waterGoal: Number(this.editingData.waterGoal) || this.DEFAULT_WATER_GOAL,
    };
    this.dailyData.set(key, payload);
    this.persistToStorage();
    this.closeEditor();
  }

  /** Remove stored data for the currently selected day (if any) */
  protected clearSelectedDay() {
    if (!this.selectedDay) return;
    const key = this.getDateKey(this.selectedDay.date);
    if (this.dailyData.has(key)) {
      this.dailyData.delete(key);
      this.persistToStorage();
    }
    this.closeEditor();
  }

  protected hasDataForDay(date: Date): boolean {
    return this.dailyData.has(this.getDateKey(date));
  }

  protected getDayData(date: Date): WellnessData | undefined {
    return this.dailyData.get(this.getDateKey(date));
  }

  // --- Summary / statistics helpers ---
  /** Returns an array of all stored entries as [dateKey, WellnessData] */
  protected getAllEntries(): Array<{ key: string; date: Date; data: WellnessData }> {
    const out: Array<{ key: string; date: Date; data: WellnessData }> = [];
    for (const [k, v] of this.dailyData.entries()) {
      const parts = k.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      out.push({ key: k, date: d, data: v });
    }
    return out.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  protected getEntriesForMonth(date: Date): Array<{ key: string; date: Date; data: WellnessData }> {
    const year = date.getFullYear();
    const month = date.getMonth();
    return this.getAllEntries().filter(
      (e) => e.date.getFullYear() === year && e.date.getMonth() === month
    );
  }

  protected computeSummary(entries: Array<{ key: string; date: Date; data: WellnessData }>) {
    const daysEntered = entries.length;
    let totalWater = 0;
    let totalSteps = 0;
    let daysMeetingWaterGoal = 0;
    let daysMeetingStepsGoal = 0;

    for (const e of entries) {
      totalWater += e.data.water || 0;
      totalSteps += e.data.steps || 0;
      if ((e.data.water || 0) >= (e.data.waterGoal || this.DEFAULT_WATER_GOAL))
        daysMeetingWaterGoal++;
      if ((e.data.steps || 0) >= (e.data.stepsGoal || this.DEFAULT_STEPS_GOAL))
        daysMeetingStepsGoal++;
    }

    const avgWater = daysEntered ? totalWater / daysEntered : 0;
    const avgSteps = daysEntered ? totalSteps / daysEntered : 0;

    return {
      daysEntered,
      totalWater,
      avgWater,
      totalSteps,
      avgSteps,
      pctWaterGoal: daysEntered ? Math.round((daysMeetingWaterGoal / daysEntered) * 100) : 0,
      pctStepsGoal: daysEntered ? Math.round((daysMeetingStepsGoal / daysEntered) * 100) : 0,
    };
  }

  // Summary for currently displayed month
  protected get monthSummary() {
    const entries = this.getEntriesForMonth(this.displayedMonth());
    return this.computeSummary(entries);
  }

  // Summary for all time
  protected get allTimeSummary() {
    const entries = this.getAllEntries();
    return this.computeSummary(entries);
  }

  private getDateKey(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * Formats large numbers into compact form: 10000 -> 10k, 2100 -> 2.1k
   * Small numbers are returned as-is (no units appended).
   */
  protected formatCompact(value: number | undefined | null): string {
    if (value == null) return '';
    const num = Number(value);
    if (Number.isNaN(num)) return '';
    if (Math.abs(num) >= 1000) {
      const abs = Math.abs(num);
      const sign = num < 0 ? '-' : '';
      if (abs >= 1000000) return sign + (abs / 1000000).toFixed(abs % 1000000 === 0 ? 0 : 1) + 'M';
      if (abs >= 1000) return sign + (abs / 1000).toFixed(abs % 1000 === 0 ? 0 : 1) + 'K';
    }
    return String(num);
  }
}

interface WellnessData {
  steps: number;
  stepsGoal: number;
  water: number; // liters
  waterGoal: number; // liters
}
