// Subject/topic categories for skills and needs

export const subjects = [
  // STEM
  { id: 'math', label: 'Mathematics', category: 'STEM', icon: 'calculator' },
  { id: 'physics', label: 'Physics', category: 'STEM', icon: 'atom' },
  { id: 'chemistry', label: 'Chemistry', category: 'STEM', icon: 'flask' },
  { id: 'biology', label: 'Biology', category: 'STEM', icon: 'leaf' },
  { id: 'computer-science', label: 'Computer Science', category: 'STEM', icon: 'laptop' },
  { id: 'engineering', label: 'Engineering', category: 'STEM', icon: 'cog' },

  // Languages
  { id: 'english', label: 'English', category: 'Languages', icon: 'book-open' },
  { id: 'spanish', label: 'Spanish', category: 'Languages', icon: 'globe' },
  { id: 'french', label: 'French', category: 'Languages', icon: 'globe' },
  { id: 'german', label: 'German', category: 'Languages', icon: 'globe' },
  { id: 'mandarin', label: 'Mandarin', category: 'Languages', icon: 'globe' },
  { id: 'arabic', label: 'Arabic', category: 'Languages', icon: 'globe' },

  // Humanities
  { id: 'history', label: 'History', category: 'Humanities', icon: 'landmark' },
  { id: 'literature', label: 'Literature', category: 'Humanities', icon: 'book' },
  { id: 'philosophy', label: 'Philosophy', category: 'Humanities', icon: 'brain' },
  { id: 'psychology', label: 'Psychology', category: 'Humanities', icon: 'users' },
  { id: 'sociology', label: 'Sociology', category: 'Humanities', icon: 'user-friends' },

  // Arts
  { id: 'music', label: 'Music', category: 'Arts', icon: 'music' },
  { id: 'art', label: 'Visual Arts', category: 'Arts', icon: 'palette' },
  { id: 'photography', label: 'Photography', category: 'Arts', icon: 'camera' },
  { id: 'design', label: 'Design', category: 'Arts', icon: 'pen-tool' },

  // Business & Economics
  { id: 'economics', label: 'Economics', category: 'Business', icon: 'trending-up' },
  { id: 'business', label: 'Business', category: 'Business', icon: 'briefcase' },
  { id: 'accounting', label: 'Accounting', category: 'Business', icon: 'dollar-sign' },
  { id: 'marketing', label: 'Marketing', category: 'Business', icon: 'megaphone' },

  // Technology
  { id: 'web-dev', label: 'Web Development', category: 'Technology', icon: 'code' },
  { id: 'mobile-dev', label: 'Mobile Development', category: 'Technology', icon: 'smartphone' },
  { id: 'data-science', label: 'Data Science', category: 'Technology', icon: 'database' },
  { id: 'ai-ml', label: 'AI & Machine Learning', category: 'Technology', icon: 'cpu' },

  // Other
  { id: 'test-prep', label: 'Test Preparation', category: 'Other', icon: 'file-text' },
  { id: 'study-skills', label: 'Study Skills', category: 'Other', icon: 'bookmark' },
];

export const categories = [
  'STEM',
  'Languages',
  'Humanities',
  'Arts',
  'Business',
  'Technology',
  'Other',
];

export const getSubjectsByCategory = (category) => {
  return subjects.filter(subject => subject.category === category);
};

export const getSubjectById = (id) => {
  return subjects.find(subject => subject.id === id);
};

export default subjects;
