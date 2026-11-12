export function noticeKey(notice) {
  return JSON.stringify([notice.id, notice.title, notice.sender, notice.text]);
}

export function unreadNotices(notices, readKeys) {
  const read = new Set(readKeys);
  return notices.filter(notice => !read.has(noticeKey(notice)));
}

export function readNoticeKeys(storage, key) {
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter(item => typeof item === 'string') : [];
  } catch { return []; }
}
