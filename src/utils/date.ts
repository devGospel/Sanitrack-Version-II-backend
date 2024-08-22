import moment from "moment-timezone";
import cronParser, { CronDate } from "cron-parser";

export const removeTime = (date: Date) => {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
};

// Function to convert time string to Date object
export const convertToTime = (
  hour: string,
  minute: string,
  scheduled_date?: Date
) => {
  const today = scheduled_date ? new Date(scheduled_date) : new Date();
  today.setHours(parseInt(hour));
  today.setMinutes(parseInt(minute));
  return today;
};

export function getCurrentDateInLosAngelesFormatted() {
  return moment().tz("America/Los_Angeles").format("YYYY-MM-DD");
}
export function getPreviousDateInLosAngelesFormatted() {
  return moment().tz("America/Los_Angeles").subtract(1, 'day').format("YYYY-MM-DD");
}

export function getNextDateInLosAngelesFormatted() {
  return moment().tz("America/Los_Angeles").add(1, 'day').format("YYYY-MM-DD");
}

export function getCurrentDateInLosAngeles() {
  const dateString = moment().tz("America/Los_Angeles").toString()
  // const desiredFormat = "YYYY-MM-DD HH:mm:ss"
  // const timeToBeConverted = moment(dateString, desiredFormat);
  // const timeZone = "America/Los_Angeles";

  // console.log(`the string we get`, dateString)
  // console.log('converted',timeToBeConverted.tz(timeZone).format(desiredFormat));
  const timeZoneId = 'America/Los_Angeles';
  const offset =  moment['tz'](moment(new Date()), timeZoneId).utcOffset() * 60000;


  // Create a new Date object with the calculated offset minus an additional hour. Doing this because it seems to be 1hr ahead without it
  const dateInLA = new Date(new Date(dateString).getTime() + offset - (60 * 60 * 1000)); // Subtracting an additional hour
  
  // console.log('Date in Los Angeles with an additional hour subtracted:', dateInLA);
  return dateInLA;
}

export function getDateInLosAngeles(dateString:string) {
  // For example, using the 'moment-timezone' library
  return moment.tz(dateString, 'YYYY-MM-DD', 'America/Los_Angeles').toDate();
}
export function endOfDayInLosAngeles(){ 
  const now = moment.tz('America/Los_Angeles');
  const endOfDay = now.clone().endOf('day').toDate();
  return  endOfDay ;
}

export function formatDateYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // January is 0, so we add 1
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
export const generateScheduledDates = (
  startDate: string | number | Date,
  endDate: string | Date,
  availableInterval: number,
  interval: number,
  excludeWeekends: boolean,
  unit: string, 
  validStartHour?: number, 
  validStopHour?: number,
  rowNumber?: number,
  worOrderName?: string,
) => {

  const dates = [];
  let currentDate = new Date(startDate);
  const dateEndDate = new Date(endDate);

  // console.log(dateEndDate)
  const daysDiff: number =
    Math.floor(
      (dateEndDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;
    // console.log(`day diff is ${daysDiff}`)
    if(unit !== "hourly" && (unit !== 'monthly')){ 
        if (availableInterval > daysDiff) {
          throw new Error("Interval of the frequency is higher than the difference between the start and end date")
            return "Interval of the frequency is higher than the difference between the start and end date";
          }
    }
  
  while (currentDate <= dateEndDate) {
    // Check if currentDate is a weekend day (Saturday or Sunday)
    if (excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
        currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
        continue;
    }

    // Ensure the event is within the valid running hours for hourly intervals
    if (unit === "hourly" && validStartHour !== undefined && validStopHour !== undefined) {
        let currentHour = currentDate.getHours();
        // Add dates for each hour within the valid hours range
        while ((currentHour <= validStopHour) && (currentDate <= dateEndDate)) {
            // Skip weekends if excludeWeekends is enabled
            if (excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6)) {
                currentDate.setDate(currentDate.getDate() + 1); // Move to the next day
                currentHour = new Date(startDate).getHours(); // Reset to start hour
                continue
            }

            if(currentHour <= validStopHour){ 
                dates.push(currentDate.toISOString())
            }

            currentHour += interval
            currentDate.setHours(currentHour)

            if ((currentHour > validStopHour) && (currentDate <= dateEndDate)) {
                const defaultDate = new Date(startDate)
                currentDate.setDate(currentDate.getDate() +1)
                currentDate.setHours(defaultDate.getHours())
                currentHour = currentDate.getHours()
            }
        }
    }
    dates.push(currentDate.toISOString());

    if (unit === "monthly") {
        currentDate.setMonth(currentDate.getMonth() + interval);
    } else {
        currentDate.setDate(currentDate.getDate() + availableInterval);
    }
}

  return dates;
};

export const generateScheduledDatesFromCronExpression = (
  cronExpression: string,
  startDate: string | number | Date,
  endDate: string | number | Date
) => {
  const options = {
    currentDate: new Date(startDate),
    endDate: new Date(endDate),
    iterator: true,
  };

  const interval = cronParser.parseExpression(cronExpression, options);
  console.log(`Date: ${JSON.stringify(interval.next())}`);
  const dates = [];
  const startTime = new Date(startDate).getTime() % (24 * 60 * 60 * 1000); // time component in milliseconds

  while (true) {
    try {
      const nextDateObj = interval.next() as IteratorResult<CronDate>;
      const nextDate = nextDateObj.value.toDate();
      const nextDateTime = nextDate.getTime();
      const adjustedDate = new Date(nextDateTime + startTime);

      if (adjustedDate <= new Date(endDate)) {
        dates.push(adjustedDate.toISOString());
      } else {
        break;
      }
    } catch (e) {
      break;
    }
  }

  // Check if the endDate itself should be included
  const lastDateObj = new Date(dates[dates.length - 1]);
  const endDateObj = new Date(endDate);
  const adjustedEndDate = new Date(endDateObj.getTime() + startTime);

  if (
    lastDateObj.toISOString() !== adjustedEndDate.toISOString() &&
    adjustedEndDate <= endDateObj
  ) {
    dates.push(adjustedEndDate.toISOString());
  }

  return dates;
};

export const preProcessExpression = (
  cronExpression: string,
  startDate: string | Date,
  unit: string
) => {
  const parts = cronExpression.split(" ");
  const formattedDate = new Date(startDate);
  if (unit == "monthly") {
    parts[3] = formattedDate.getDate() as unknown as string;
  }
  console.log(parts.join(" "));
  return parts.join(" ");
};
