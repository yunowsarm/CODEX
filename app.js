const imageInput = document.getElementById('imageInput');
const zipInput = document.getElementById('zipInput');
const imageMeta = document.getElementById('imageMeta');
const zipMeta = document.getElementById('zipMeta');
const preview = document.getElementById('preview');
const buildBtn = document.getElementById('buildBtn');
const downloadImageBtn = document.getElementById('downloadImageBtn');
const downloadZipBtn = document.getElementById('downloadZipBtn');
const logList = document.getElementById('logList');

let imageFile;
let zipFile;
let mergedBlob;

function addLog(message) {
  const item = document.createElement('li');
  item.textContent = `${new Date().toLocaleTimeString()} - ${message}`;
  logList.prepend(item);
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
  return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}

function updateBuildState() {
  buildBtn.disabled = !(imageFile && zipFile);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

imageInput.addEventListener('change', () => {
  const file = imageInput.files?.[0];
  if (!file) return;

  imageFile = file;
  imageMeta.textContent = `${file.name} (${formatSize(file.size)})`;
  preview.src = URL.createObjectURL(file);
  addLog(`已载入图片：${file.name}`);
  updateBuildState();
});

zipInput.addEventListener('change', () => {
  const file = zipInput.files?.[0];
  if (!file) return;

  if (!file.name.toLowerCase().endsWith('.zip')) {
    addLog('警告：所选文件不是 .zip 后缀，仍允许尝试处理。');
  }

  zipFile = file;
  zipMeta.textContent = `${file.name} (${formatSize(file.size)})`;
  addLog(`已载入压缩包：${file.name}`);
  updateBuildState();
});

buildBtn.addEventListener('click', async () => {
  if (!(imageFile && zipFile)) return;

  const [imageBuffer, zipBuffer] = await Promise.all([
    imageFile.arrayBuffer(),
    zipFile.arrayBuffer(),
  ]);

  mergedBlob = new Blob([imageBuffer, zipBuffer], {
    type: imageFile.type || 'application/octet-stream',
  });

  downloadImageBtn.disabled = false;
  downloadZipBtn.disabled = false;
  addLog(
    `已生成复合文件（${formatSize(mergedBlob.size)}）。可下载为图片后缀，或下载/改名为 .zip。`
  );
});

function buildFileName(ext) {
  const rawName = (imageFile?.name || 'merged').replace(/\.[^.]+$/, '');
  return `${rawName}-polyglot.${ext}`;
}

downloadImageBtn.addEventListener('click', () => {
  if (!mergedBlob) return;
  const imageExt = (imageFile?.name.split('.').pop() || 'jpg').toLowerCase();
  downloadBlob(mergedBlob, buildFileName(imageExt));
  addLog('已下载图片后缀版本。');
});

downloadZipBtn.addEventListener('click', () => {
  if (!mergedBlob) return;
  downloadBlob(mergedBlob, buildFileName('zip'));
  addLog('已下载 .zip 版本。');
});
