export const getTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) {
    return 'Ahora mismo';
  } else if (diffInMinutes < 60) {
    return `Hace ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours}h`;
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays}d`;
  } else if (diffInWeeks < 4) {
    return `Hace ${diffInWeeks}sem`;
  } else if (diffInMonths < 12) {
    return `Hace ${diffInMonths}mes`;
  } else {
    return `Hace ${diffInYears}año${diffInYears > 1 ? 's' : ''}`;
  }
};

export const isNewProfile = (date: Date): boolean => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInHours = diffInMs / (1000 * 60 * 60);
  return diffInHours < 24; // Menos de 24 horas
};