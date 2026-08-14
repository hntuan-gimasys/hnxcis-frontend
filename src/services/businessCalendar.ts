/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface HolidayItem {
  fromDate: string; // YYYY-MM-DD
  toDate: string;
  year: number;
  holidayType: 'HOLIDAY' | 'MAKEUP_WORKDAY';
  nameVi: string;
}

// Default Seed Holidays for 2026
const HOLIDAYS_2026: HolidayItem[] = [
  { fromDate: '2026-01-01', toDate: '2026-01-01', year: 2026, holidayType: 'HOLIDAY', nameVi: 'Tết Dương Lịch' },
  { fromDate: '2026-02-16', toDate: '2026-02-20', year: 2026, holidayType: 'HOLIDAY', nameVi: 'Tết Nguyên Đán 2026' },
  { fromDate: '2026-04-26', toDate: '2026-04-26', year: 2026, holidayType: 'HOLIDAY', nameVi: 'Giỗ Tổ Hùng Vương' },
  { fromDate: '2026-04-30', toDate: '2026-05-01', year: 2026, holidayType: 'HOLIDAY', nameVi: 'Ngày 30/4 & Quốc tế Lao động' },
  { fromDate: '2026-09-02', toDate: '2026-09-02', year: 2026, holidayType: 'HOLIDAY', nameVi: 'Quốc Khánh' },
  // Example makeup workday
  { fromDate: '2026-02-28', toDate: '2026-02-28', year: 2026, holidayType: 'MAKEUP_WORKDAY', nameVi: 'Thứ 7 Làm bù Tết' },
];

export class BusinessCalendarService {
  private holidays: HolidayItem[] = HOLIDAYS_2026;

  public setHolidays(holidays: HolidayItem[]) {
    this.holidays = holidays;
  }

  public isWorkingDay(date: Date): boolean {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 = Sun, 6 = Sat

    // Check if makeup workday
    const isMakeup = this.holidays.some(
      (h) => h.holidayType === 'MAKEUP_WORKDAY' && dateStr >= h.fromDate && dateStr <= h.toDate
    );
    if (isMakeup) return true;

    // Check if weekend
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    // Check if holiday
    const isHoliday = this.holidays.some(
      (h) => h.holidayType === 'HOLIDAY' && dateStr >= h.fromDate && dateStr <= h.toDate
    );
    return !isHoliday;
  }

  public addWorkingDays(fromDate: Date, workingDays: number): Date {
    const result = new Date(fromDate);
    let added = 0;
    const direction = workingDays >= 0 ? 1 : -1;
    const target = Math.abs(workingDays);

    while (added < target) {
      result.setDate(result.getDate() + direction);
      if (this.isWorkingDay(result)) {
        added++;
      }
    }
    return result;
  }

  public workingDaysBetween(fromDate: Date, toDate: Date): number {
    const start = new Date(fromDate);
    const end = new Date(toDate);
    if (start > end) return -this.workingDaysBetween(end, start);

    let count = 0;
    const current = new Date(start);
    current.setDate(current.getDate() + 1);

    while (current <= end) {
      if (this.isWorkingDay(current)) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }
    return count;
  }

  public formatVndWords(amount: number): string {
    if (!amount || amount === 0) return 'không đồng';
    
    const units = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    
    function readGroup(n: number): string {
      let str = '';
      const hundred = Math.floor(n / 100);
      const ten = Math.floor((n % 100) / 10);
      const unit = n % 10;

      if (hundred > 0 || n > 99) {
        str += units[hundred] + ' trăm ';
      }
      if (ten > 1) {
        str += units[ten] + ' mươi ';
        if (unit === 1) str += 'mốt ';
        else if (unit === 5) str += 'lăm ';
        else if (unit > 0) str += units[unit] + ' ';
      } else if (ten === 1) {
        str += 'mười ';
        if (unit === 5) str += 'lăm ';
        else if (unit > 0) str += units[unit] + ' ';
      } else if (ten === 0 && unit > 0) {
        if (hundred > 0) str += 'lẻ ';
        str += units[unit] + ' ';
      }
      return str;
    }

    const scales = ['', 'ngàn', 'triệu', 'tỷ', 'ngàn tỷ', 'triệu tỷ'];
    let temp = Math.floor(amount);
    let scaleIndex = 0;
    let result = '';

    while (temp > 0) {
      const group = temp % 1000;
      if (group > 0) {
        const groupStr = readGroup(group);
        result = groupStr + scales[scaleIndex] + ' ' + result;
      }
      temp = Math.floor(temp / 1000);
      scaleIndex++;
    }

    result = result.trim() + ' đồng';
    return result.charAt(0).toUpperCase() + result.slice(1);
  }
}

export const calendarService = new BusinessCalendarService();
