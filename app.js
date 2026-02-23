//绑定页面上的 input、预览、按钮、日志等 DOM
const imageInput = document.getElementById('imageInput');
const zipInput = document.getElementById('zipInput');
const imageMeta = document.getElementById('imageMeta');
const zipMeta = document.getElementById('zipMeta');
const saveDirMeta = document.getElementById('saveDirMeta');
const preview = document.getElementById('preview');
const buildBtn = document.getElementById('buildBtn');
const chooseDirBtn = document.getElementById('chooseDirBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const previewCard = document.getElementById('previewCard');
const resetBtn = document.getElementById('resetBtn');
//全局：存储路径、图片、ZIP、拼好的 Blob
const SAVE_DIR_KEY = 'codex-save-dir';
let saveDirPath = localStorage.getItem(SAVE_DIR_KEY) || null;
let imageFile;
let zipFile;
let mergedBlob;

// 初始化：恢复上次选择的存储路径，有则允许直接打开文件夹
if (saveDirPath && saveDirMeta) {
  saveDirMeta.textContent = saveDirPath;
  saveDirMeta.classList.add('meta-filled');
  if (openFolderBtn) openFolderBtn.disabled = false;
}
updateBuildState();

// ElMessage 风格提示：顶部居中、自动消失
function showMessage(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const el = document.createElement('div');
  el.className = `toast-message toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('toast-out');
    setTimeout(() => el.remove(), 200);
  }, 2500);
}

//formatSize：把字节数格式化成 B/KB/MB
function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

// 选了存储位置 + 图片 + 其他文件 才允许点「生成」（无 electronAPI 时仅需图片+文件）
function updateBuildState() {
  const hasDir = typeof window.electronAPI === 'undefined' || saveDirPath;
  buildBtn.disabled = !(imageFile && zipFile && hasDir);
}

// 图片选择：存 imageFile、更新 meta、预览、打日志、更新按钮状态；有图才显示预览区
imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) {
    imageFile = null;
    imageMeta.textContent = '未选择文件';
    imageMeta.classList.remove('meta-filled');
    previewCard.classList.add('hidden');
    updateBuildState();
    return;
  }
  imageFile = file;
  imageMeta.textContent = `${file.name} (${formatSize(file.size)})`;
  imageMeta.classList.add('meta-filled');
  preview.src = URL.createObjectURL(file);
  previewCard.classList.remove('hidden');
  updateBuildState();
});

// ZIP 选择：存 zipFile、更新 meta、更新按钮状态
zipInput.addEventListener('change', () => {
  const file = zipInput.files?.[0];
  if (!file) return;
  zipFile = file;
  zipMeta.textContent = `${file.name} (${formatSize(file.size)})`;
  zipMeta.classList.add('meta-filled');
  updateBuildState();
});

// 选择文件存储位置（仅 Electron）；选完即可打开文件夹，并写入本地存储
chooseDirBtn.addEventListener('click', async () => {
  if (typeof window.electronAPI === 'undefined') return;
  const path = await window.electronAPI.chooseSaveDirectory();
  saveDirPath = path || null;
  saveDirMeta.textContent = path || '未选择';
  saveDirMeta.classList.toggle('meta-filled', !!path);
  if (path) {
    localStorage.setItem(SAVE_DIR_KEY, path);
    openFolderBtn.disabled = false;
  } else {
    localStorage.removeItem(SAVE_DIR_KEY);
    openFolderBtn.disabled = true;
  }
  updateBuildState();
});

// 核心：把图片 + ZIP 拼成 Blob，若有存储位置则写入该文件夹
buildBtn.addEventListener('click', async () => {
  if (!(imageFile && zipFile)) return;
  const needDir = typeof window.electronAPI !== 'undefined' && !saveDirPath;
  if (needDir) return;

  const [imageBuffer, zipBuffer] = await Promise.all([
    imageFile.arrayBuffer(),
    zipFile.arrayBuffer(),
  ]);

  mergedBlob = new Blob([imageBuffer, zipBuffer], {
    type: imageFile.type || 'application/octet-stream',
  });

  const imageExt = (imageFile.name.split('.').pop() || 'jpg').toLowerCase();
  const filename = buildFileName(imageExt);

  if (window.electronAPI && saveDirPath) {
    try {
      await window.electronAPI.saveMergedFile(
        saveDirPath,
        filename,
        await mergedBlob.arrayBuffer()
      );
      showMessage('图片已保存');
    } catch (_e) {}
  }
});

// 打开生成文件夹（仅 Electron，且已选过存储位置）
openFolderBtn.addEventListener('click', () => {
  if (window.electronAPI && saveDirPath) window.electronAPI.openFolder(saveDirPath);
});

// 生成复合文件名：原图名-polyglot.(图片后缀 或 zip)
function buildFileName(ext) {
  const rawName = (imageFile?.name || 'merged').replace(/\.[^.]+$/, '');
  return `${rawName}-polyglot.${ext}`;
}

// 重置：清空存储位置、文件、预览、日志，恢复初始状态
resetBtn.addEventListener('click', () => {
  imageFile = null;
  zipFile = null;
  mergedBlob = null;
  imageInput.value = '';
  zipInput.value = '';
  imageMeta.textContent = '未选择文件';
  zipMeta.textContent = '未选择文件';
  imageMeta.classList.remove('meta-filled');
  zipMeta.classList.remove('meta-filled');
  preview.src = '';
  previewCard.classList.add('hidden');
  buildBtn.disabled = true;
  if (!saveDirPath) openFolderBtn.disabled = true;
});
