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
  useUserTimezone;

  constructor({after = null, before = null} = {}, useUserTimezone = true) {
    super();
    this.after = after;
    this.before = before;
    this.useUserTimezone = useUserTimezone;
  }

  normalize() {
    this.constructor.ensureTimezoneIsSet();
    const timezone = this.useUserTimezone ? this.constructor.userTimezone : 'UTC';
    let after = null;
    let before = null;
    if (!empty(this.after)) {
      after = dayjs.tz(this.after, timezone)
        .hour(0)
        .minute(0)
        .second(0)
        .tz('UTC')
        .format('YYYY-MM-DD[T]HH:mm:ss[Z]');
    }
    if (!empty(this.before)) {
      before = dayjs.tz(this.before, timezone)
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
      this.after = this.useUserTimezone
        ? dayjs.tz(input.after, 'UTC').tz(this.constructor.userTimezone)
        : dayjs.tz(input.after, 'UTC');
      this.after = this.after
        .hour(0)
        .minute(0)
        .second(0)
        .format('YYYY-MM-DD');
    }
    if (!empty(input.before)) {
      this.before = this.useUserTimezone
        ? dayjs.tz(input.before, 'UTC').tz(this.constructor.userTimezone)
        : dayjs.tz(input.before, 'UTC');
      this.before = this.before
        .hour(0)
        .minute(0)
        .second(0)
        .add(1, 'day')
        .subtract(1, 'second')
        .format('YYYY-MM-DD');
    }
  }

  static ensureTimezoneIsSet() {
    this.constructor.userTimezone = this.constructor.userTimezone ?? (dayjs.tz.guess() || 'UTC');
  }
}
