import Filter from './filter.js';
import empty from 'is-empty';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DatetimeRangeFilter extends Filter {
  static userTimezone;
  after;
  before;

  constructor({after = null, before = null} = {}) {
    super();
    this.after = after;
    this.before = before;
  }

  normalize() {
    this.constructor.ensureTimezoneIsSet();
    let after = null;
    let before = null;
    if (!empty(this.after)) {
      after = dayjs.tz(this.after, this.constructor.userTimezone)
        .tz('UTC')
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, this.constructor.userTimezone)
        .tz('UTC')
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }

    return {after, before};
  }

  async denormalize(input) {
    this.constructor.ensureTimezoneIsSet();
    this.after = null;
    this.before = null;
    if (!empty(input.after)) {
      this.after = dayjs.tz(input.after, 'UTC')
        .tz(this.constructor.userTimezone)
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }
    if (!empty(input.before)) {
      this.before = dayjs.tz(input.before, 'UTC')
        .tz(this.constructor.userTimezone)
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }
  }

  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (dayjs.tz.guess() || 'UTC');
  }
}
