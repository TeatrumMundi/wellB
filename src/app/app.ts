import { Component, signal, ElementRef, ViewChild, OnInit } from '@angular/core';
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
  imports: [RouterOutlet, FormsModule, MatFormFieldModule, MatInputModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('wellB');
  protected readonly calendarDays = signal<CalendarDay[]>([]);
  protected readonly calendarWeeks = signal<(CalendarDay | null)[][]>([]);

  @ViewChild('contentSection') contentSection!: ElementRef;

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
    const days = this.generateCalendarDays();
    this.calendarDays.set(days);
    this.calendarWeeks.set(this.organizeIntoWeeks(days));
    this.loadFromStorage();
  }

  scrollToContent() {
    this.contentSection.nativeElement.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  getCurrentMonthYear(): string {
    const now = new Date();
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

  private generateCalendarDays(): CalendarDay[] {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    // First day of the current month
    const firstDay = new Date(year, month, 1);
    // Last day of the current month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the first Monday of the calendar grid
    const startDate = new Date(firstDay);
    const firstDayOfWeek = firstDay.getDay();
    // Convert Sunday (0) to 7 for Monday-based week calculation
    const mondayBasedFirstDay = firstDayOfWeek === 0 ? 7 : firstDayOfWeek;
    startDate.setDate(startDate.getDate() - (mondayBasedFirstDay - 1));

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Add previous month days if needed
    for (let date = new Date(startDate); date < firstDay; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);

      days.push({
        day: date.getDate(),
        date: new Date(date),
        isCurrentMonth: false,
        isToday: currentDate.getTime() === today.getTime(),
      });
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

    // Don't add next month days - leave empty spaces instead

    return days;
  }

  getCalendarDays(): CalendarDay[] {
    return this.calendarDays();
  }

  private organizeIntoWeeks(days: CalendarDay[]): (CalendarDay | null)[][] {
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
