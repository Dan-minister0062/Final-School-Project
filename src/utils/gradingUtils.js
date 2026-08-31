// Grading utility with configurable scale
export const GRADING_SCALE = {
  'A+': { min: 90, max: 100, description: 'Excellent' },
  'A': { min: 80, max: 89.99, description: 'Very Good' },
  'B+': { min: 75, max: 79.99, description: 'Good' },
  'B': { min: 70, max: 74.99, description: 'Above Average' },
  'C+': { min: 60, max: 69.99, description: 'Average' },
  'C': { min: 50, max: 59.99, description: 'Below Average' },
  'D': { min: 40, max: 49.99, description: 'Poor' },
  'F': { min: 0, max: 39.99, description: 'Fail' }
};

export const getGradeFromPercentage = (percentage) => {
  for (const [grade, range] of Object.entries(GRADING_SCALE)) {
    if (percentage >= range.min && percentage <= range.max) {
      return grade;
    }
  }
  return 'F';
};

export const getGradeDescription = (grade) => {
  return GRADING_SCALE[grade]?.description || 'N/A';
};

export const calculateGrade = (score, totalMarks) => {
  if (totalMarks === 0) return { percentage: 0, grade: 'N/A' };
  
  const percentage = (score / totalMarks) * 100;
  const grade = getGradeFromPercentage(percentage);
  
  return {
    percentage: Math.round(percentage * 100) / 100,
    grade,
    gradeDescription: getGradeDescription(grade)
  };
};