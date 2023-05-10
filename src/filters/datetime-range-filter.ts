import Filter from './filter';
import empty from 'is-empty';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const FORMAT = 'YYYY-MM-DD[T]HH:mm:ss[Z]';
const UTC = 'UTC';

interface DatetimeRange {
    before?: string;
    after?: string;
}

export class DatetimeRangeFilter implements Filter<DatetimeRange> {
    static userTimezone: string;
    private after?: string;
    private before?: string;

    constructor({ after, before }: DatetimeRange = {}) {
        this.after = after;
        this.before = before;
    }

    normalize(): DatetimeRange {
        DatetimeRangeFilter.ensureTimezoneIsSet();
        let after;
        let before;
        if (!empty(this.after)) {
            after = dayjs.tz(this.after, DatetimeRangeFilter.userTimezone).tz(UTC).format(FORMAT);
        }
        if (!empty(this.before)) {
            before = dayjs.tz(this.before, DatetimeRangeFilter.userTimezone).tz(UTC).format(FORMAT);
        }

        return { after, before };
    }

    async denormalize(input: any) {
        DatetimeRangeFilter.ensureTimezoneIsSet();
        this.after = undefined;
        this.before = undefined;
        if (!empty(input.after)) {
            this.after = dayjs.tz(input.after, UTC).tz(DatetimeRangeFilter.userTimezone).format(FORMAT);
        }
        if (!empty(input.before)) {
            this.before = dayjs.tz(input.before, UTC).tz(DatetimeRangeFilter.userTimezone).format(FORMAT);
        }
    }

    static ensureTimezoneIsSet() {
        DatetimeRangeFilter.userTimezone = DatetimeRangeFilter.userTimezone ?? (dayjs.tz.guess() || UTC);
    }
}
