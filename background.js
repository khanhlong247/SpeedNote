// Xử lý sự kiện khi extension được cài đặt lần đầu hoặc cập nhật
chrome.runtime.onInstalled.addListener(() => {
  console.log("Extension installed or updated.");
});
