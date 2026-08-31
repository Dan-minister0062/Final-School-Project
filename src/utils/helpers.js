// ✅ Single declaration of all functions - NO DUPLICATES

export const formatDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

export const getLevelLabel = (level) => {
  const levels = {
    nursery: 'Kindergarden School',
    primary: 'Primary School',
    secondary: 'Secondary School',
    high_school: 'High School',
  };
  return levels[level] || level;
};

// ✅ Arabic Numeral Functions (only declared once)
export const toArabicNumerals = (number) => {
  const arabicNumbers = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩'
  };
  return String(number).split('').map(digit => arabicNumbers[digit] || digit).join('');
};

export const formatMilestoneYear = (year, isArabic) => {
  if (isArabic) {
    return toArabicNumerals(year);
  }
  return year;
};