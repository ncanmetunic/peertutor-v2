/**
 * File utility functions
 */

/**
 * Format file size from bytes to human-readable format
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
};

/**
 * Get file name without extension
 */
export const getFileNameWithoutExtension = (fileName) => {
  if (!fileName) return '';
  const parts = fileName.split('.');
  if (parts.length > 1) {
    parts.pop();
  }
  return parts.join('.');
};

/**
 * Get icon name based on file type
 */
export const getFileIcon = (fileName) => {
  const extension = getFileExtension(fileName);

  const iconMap = {
    // Documents
    pdf: 'file-pdf-box',
    doc: 'file-word',
    docx: 'file-word',
    txt: 'file-document',
    rtf: 'file-document',
    odt: 'file-document',

    // Spreadsheets
    xls: 'file-excel',
    xlsx: 'file-excel',
    csv: 'file-delimited',
    ods: 'file-excel',

    // Presentations
    ppt: 'file-powerpoint',
    pptx: 'file-powerpoint',
    odp: 'file-powerpoint',

    // Images
    jpg: 'file-image',
    jpeg: 'file-image',
    png: 'file-image',
    gif: 'file-image',
    bmp: 'file-image',
    svg: 'file-image',
    webp: 'file-image',

    // Videos
    mp4: 'file-video',
    avi: 'file-video',
    mov: 'file-video',
    wmv: 'file-video',
    flv: 'file-video',
    webm: 'file-video',

    // Audio
    mp3: 'file-music',
    wav: 'file-music',
    ogg: 'file-music',
    m4a: 'file-music',
    flac: 'file-music',

    // Archives
    zip: 'zip-box',
    rar: 'zip-box',
    '7z': 'zip-box',
    tar: 'zip-box',
    gz: 'zip-box',

    // Code
    js: 'language-javascript',
    jsx: 'language-javascript',
    ts: 'language-typescript',
    tsx: 'language-typescript',
    py: 'language-python',
    java: 'language-java',
    cpp: 'language-cpp',
    c: 'language-c',
    html: 'language-html5',
    css: 'language-css3',
    json: 'code-json',
    xml: 'xml',
    md: 'language-markdown',
  };

  return iconMap[extension] || 'file';
};

/**
 * Get file type category
 */
export const getFileCategory = (fileName) => {
  const extension = getFileExtension(fileName);

  const categories = {
    document: ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'],
    spreadsheet: ['xls', 'xlsx', 'csv', 'ods'],
    presentation: ['ppt', 'pptx', 'odp'],
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    video: ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'],
    audio: ['mp3', 'wav', 'ogg', 'm4a', 'flac'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz'],
    code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'xml', 'md'],
  };

  for (const [category, extensions] of Object.entries(categories)) {
    if (extensions.includes(extension)) {
      return category;
    }
  }

  return 'other';
};

/**
 * Check if file is an image
 */
export const isImage = (fileName) => {
  return getFileCategory(fileName) === 'image';
};

/**
 * Check if file is a document
 */
export const isDocument = (fileName) => {
  const category = getFileCategory(fileName);
  return ['document', 'spreadsheet', 'presentation'].includes(category);
};

/**
 * Check if file is a video
 */
export const isVideo = (fileName) => {
  return getFileCategory(fileName) === 'video';
};

/**
 * Check if file is audio
 */
export const isAudio = (fileName) => {
  return getFileCategory(fileName) === 'audio';
};

/**
 * Truncate filename if too long
 */
export const truncateFileName = (fileName, maxLength = 30) => {
  if (!fileName || fileName.length <= maxLength) {
    return fileName;
  }

  const extension = getFileExtension(fileName);
  const nameWithoutExt = getFileNameWithoutExtension(fileName);
  const maxNameLength = maxLength - extension.length - 4; // -4 for "..." and "."

  if (maxNameLength <= 0) {
    return fileName.substring(0, maxLength) + '...';
  }

  return nameWithoutExt.substring(0, maxNameLength) + '...' + '.' + extension;
};

/**
 * Generate unique file name to avoid collisions
 */
export const generateUniqueFileName = (originalFileName) => {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalFileName);
  const nameWithoutExt = getFileNameWithoutExtension(originalFileName);

  return `${nameWithoutExt}_${timestamp}_${randomStr}.${extension}`;
};

/**
 * Get mime type from file extension
 */
export const getMimeType = (fileName) => {
  const extension = getFileExtension(fileName);

  const mimeTypes = {
    // Documents
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    rtf: 'application/rtf',

    // Spreadsheets
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    csv: 'text/csv',

    // Presentations
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

    // Images
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    bmp: 'image/bmp',
    svg: 'image/svg+xml',
    webp: 'image/webp',

    // Videos
    mp4: 'video/mp4',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    wmv: 'video/x-ms-wmv',
    webm: 'video/webm',

    // Audio
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    m4a: 'audio/mp4',

    // Archives
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
  };

  return mimeTypes[extension] || 'application/octet-stream';
};
