export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(date) {
  return isSameDay(date, new Date());
}

export function isTomorrow(date) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return isSameDay(date, tomorrow);
}

export function formatTime(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
}

export function formatDay(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

// "Today, 4:00 PM" / "Tomorrow, 9:00 AM" / "Sep 3, 2:00 PM" - used wherever a
// planned working time is shown, so it reads as "when I'll do this".
export function formatPlanned(dateInput) {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return null;
  const time = formatTime(date);
  if (isToday(date)) return `Today, ${time}`;
  if (isTomorrow(date)) return `Tomorrow, ${time}`;
  return `${formatDay(date)}, ${time}`;
}

export function formatWeekdayDate(dateInput) {
  const date = new Date(dateInput);
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    weekday: "long",
  });
}

export function greetingForNow() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export function groupTasksByDate(tasks) {
  const groups = { today: [], tomorrow: [], upcoming: [], noDate: [] };
  for (const task of tasks) {
    if (!task.due_date) {
      groups.noDate.push(task);
      continue;
    }
    const date = new Date(task.due_date);
    if (isToday(date)) groups.today.push(task);
    else if (isTomorrow(date)) groups.tomorrow.push(task);
    else if (date.getTime() > Date.now()) groups.upcoming.push(task);
    else groups.today.push(task);
  }
  return groups;
}
