export const getWATDate = () => {
  const now = new Date();
  const watOffset = 60 * 60 * 1000; // UTC+1
  return new Date(now.getTime() + watOffset);
};

export const formatWATDate = (date) => {
  return date.toLocaleString("en-US", {
    timeZone: "Africa/Lagos",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};
