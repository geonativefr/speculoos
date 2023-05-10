import Filter from './filter';
import empty from 'is-empty';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

interface DateRange {
    before?: string;
    after?: string;
}

export class DateRangeFilter implements Filter<DateRange> {
    static userTimezone: string;
    private after?: string;
    private before?: string;
    private normalizedFormat: string;
    private useUserTimezone: boolean;

    constructor({ after, before }: DateRange = {}, { withTime = true, useUserTimezone = true } = {}) {
        this.after = after;
        this.before = before;
        this.normalizedFormat = withTime ? 'YYYY-MM-DD[T]HH:mm:ss[Z]' : 'YYYY-MM-DD';
        this.useUserTimezone = useUserTimezone;
    }

    normalize(): DateRange {
        DateRangeFilter.ensureTimezoneIsSet();
        const timezone = this.useUserTimezone ? DateRangeFilter.userTimezone : 'UTC';
        let after;
        let before;
        if (!empty(this.after)) {
            after = dayjs.tz(this.after, timezone).hour(0).minute(0).second(0).tz('UTC').format(this.normalizedFormat);
        }
        if (!empty(this.before)) {
            before = dayjs
                .tz(this.before, timezone)
                .hour(0)
                .minute(0)
                .second(0)
                .add(1, 'day')
                .subtract(1, 'second')
                .tz('UTC')
                .format(this.normalizedFormat);
        }

        return { after, before };
    }

    async denormalize(input: any) {
        DateRangeFilter.ensureTimezoneIsSet();
        this.after = undefined;
        this.before = undefined;
        if (!empty(input.after)) {
            this.after = (
                this.useUserTimezone
                    ? dayjs.tz(input.after, 'UTC').tz(DateRangeFilter.userTimezone)
                    : dayjs.tz(input.after, 'UTC')
            )
                .hour(0)
                .minute(0)
                .second(0)
                .format('YYYY-MM-DD');
        }
        if (!empty(input.before)) {
            this.before = (
                this.useUserTimezone
                    ? dayjs.tz(input.before, 'UTC').tz(DateRangeFilter.userTimezone)
                    : dayjs.tz(input.before, 'UTC')
            )
                .hour(0)
                .minute(0)
                .second(0)
                .add(1, 'day')
                .subtract(1, 'second')
                .format('YYYY-MM-DD');
        }
    }

    static ensureTimezoneIsSet() {
        DateRangeFilter.userTimezone = DateRangeFilter.userTimezone ?? (dayjs.tz.guess() || 'UTC');
    }
}
