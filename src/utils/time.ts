import { TimeObject } from "../types";
import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const DEFAULT_TIMEZONE = "Europe/Paris";
const SMALL_DATE_FORMAT = "MM/DD/YYYY HH:mm";
const NORMAL_DATE_FORMAT = "ddd DD MMM YYYY [at] HH:mm";
const FULL_DATE_FORMAT = "dddd, MMMM DD YYYY, HH:mm:ss";

export function formatTime(time: Date | string): TimeObject {
  const date = dayjs(time, ["DD/MM/YYYY HH:mm", "MM/DD/YYYY HH:mm"], true).tz(
    DEFAULT_TIMEZONE,
  );

  if (!date.isValid()) {
    throw new Error("Invalid date");
  }

  return {
    date: date.toDate(),
    small: date.format(SMALL_DATE_FORMAT),
    normal: date.format(NORMAL_DATE_FORMAT),
    full: date.format(FULL_DATE_FORMAT),
  };
}
