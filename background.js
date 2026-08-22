// ATAB - Background Service Worker (Manifest V3)

// Context Menu Setup
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "save-to-atab",
    title: "ATAB'a Yer İmi Olarak Kaydet",
    contexts: ["page", "link"]
  });
});

// Save bookmark helper
async function saveBookmark(title, url, favIconUrl) {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return false;
  }

  try {
    const result = await chrome.storage.local.get(['atab_bookmarks']);
    const bookmarks = result.atab_bookmarks || [];

    // Check if already bookmarked
    const existingIndex = bookmarks.findIndex(b => b.url === url);
    const newBookmark = {
      id: 'bm_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      title: title || url,
      url: url,
      icon: favIconUrl || `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`,
      createdAt: Date.now()
    };

    if (existingIndex >= 0) {
      bookmarks[existingIndex] = newBookmark;
    } else {
      bookmarks.unshift(newBookmark);
    }

    await chrome.storage.local.set({ atab_bookmarks: bookmarks });

    // Flash badge confirmation
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
    setTimeout(() => {
      chrome.action.setBadgeText({ text: '' });
    }, 2000);

    return true;
  } catch (err) {
    console.error('Bookmark save error:', err);
    return false;
  }
}

// Keyboard Shortcut Command Listener (Alt+B)
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'save-bookmark') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      await saveBookmark(tab.title, tab.url, tab.favIconUrl);
    }
  }
});

// Context Menu Click Listener
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "save-to-atab") {
    if (info.linkUrl) {
      try {
        const domain = new URL(info.linkUrl).hostname;
        const icon = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        await saveBookmark(domain, info.linkUrl, icon);
      } catch (e) {
        await saveBookmark(info.linkUrl, info.linkUrl, '');
      }
    } else if (tab && tab.url) {
      await saveBookmark(tab.title, tab.url, tab.favIconUrl);
    }
  }
});
