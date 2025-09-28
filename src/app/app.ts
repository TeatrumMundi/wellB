import { Component, signal, ElementRef, ViewChild, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface CalendarDay {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('wellB');
  protected readonly calendarDays = signal<CalendarDay[]>([]);
  protected readonly calendarWeeks = signal<(CalendarDay | null)[][]>([]);

  @ViewChild('contentSection') contentSection!: ElementRef;

  ngOnInit() {
    const days = this.generateCalendarDays();
    this.calendarDays.set(days);
    this.calendarWeeks.set(this.organizeIntoWeeks(days));
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
}
