// 渲染进程脚本
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const testBtn = document.getElementById('testBtn');
  const resultEl = document.getElementById('result');

  // 检查 Electron API 是否可用
  if (window.electronAPI) {
    statusEl.textContent = `✅ Electron 已就绪 (平台: ${window.electronAPI.platform})`;
    statusEl.classList.add('success');
  } else {
    statusEl.textContent = '⚠️ Electron API 不可用';
  }

  // 测试按钮点击事件
  testBtn.addEventListener('click', async () => {
    try {
      const response = await window.electronAPI.ping();
      resultEl.textContent = `🎉 IPC 通信成功！响应: ${response}`;
      resultEl.classList.add('show');
    } catch (error) {
      resultEl.textContent = `❌ 通信失败: ${error.message}`;
      resultEl.classList.add('show');
    }
  });
});
