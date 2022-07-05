import Filter from './filter.js';
import empty from 'is-empty';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DateRangeFilter extends Filter {
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
        .hour(0)
        .minute(0)
        .second(0)
        .tz('UTC')
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, this.constructor.userTimezone)
        .hour(0)
        .minute(0)
        .second(0)
        .add(1, 'day')
        .subtract(1, 'second')
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
        .tz(this.userTimezone)
        .hour(0)
        .minute(0)
        .second(0)
        .format('YYYY-MM-DD');
    }
    if (!empty(input.before)) {
      this.before = dayjs.tz(input.before, 'UTC')
        .tz(this.userTimezone)
        .hour(0)
        .minute(0)
        .second(0)
        .add(1, 'day')
        .subtract(1, 'second')
        .format('YYYY-MM-DD');
    }
  }

  static ensureTimezoneIsSet() {
    this.userTimezone = this.userTimezone ?? (dayjs.tz.guess() || 'UTC');
  }
}
