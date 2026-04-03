export const formatDateTime = (value?: string | null) => {
  if (!value) {
    return "Нет данных";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

export const formatPercent = (value: number) => `${value > 0 ? "+" : ""}${value}%`;
