const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const { ZipArchive } = require('archiver');

async function ensureFolder(folderPath) {
  const stat = await fsp.stat(folderPath);
  if (!stat.isDirectory()) throw new Error('Selected path is not a folder.');
}

async function walk(folderPath, visitor) {
  const entries = await fsp.readdir(folderPath, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(folderPath, entry.name);
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    if (entry.isDirectory()) {
      await walk(fullPath, visitor);
    } else if (entry.isFile()) {
      await visitor(fullPath);
    }
  }
}

// Check if any file in the folder differs from the given fileStates map.
// This is an optimized version of diffFolder for the watcher to quickly say if it's dirty.
async function hasChanges(folderPath, fileStates) {
  let changed = false;
  let fileCount = 0;
  await walk(folderPath, async (filePath) => {
    if (changed) return; // early exit
    fileCount += 1;
    const stat = await fsp.stat(filePath);
    const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');
    const effectiveChangeTime = Math.max(stat.mtimeMs, stat.birthtimeMs);
    
    const state = fileStates.get(relativePath);
    if (!state) {
      changed = true;
    } else if (effectiveChangeTime > state.mtime || stat.size !== state.size) {
      changed = true;
    }
  });
  return { changed, fileCount };
}

async function diffFolder(folderPath, fileStates) {
  const files = [];
  await walk(folderPath, async (filePath) => {
    const stat = await fsp.stat(filePath);
    const relativePath = path.relative(folderPath, filePath).replace(/\\/g, '/');
    const effectiveChangeTime = Math.max(stat.mtimeMs, stat.birthtimeMs);

    let status;
    const state = fileStates.get(relativePath);
    if (!state) {
      status = 'new';
    } else if (effectiveChangeTime > state.mtime || stat.size !== state.size) {
      status = 'modified';
    } else {
      status = 'unchanged';
    }

    files.push({
      relativePath,
      status,
      mtime: effectiveChangeTime,
      size: stat.size,
    });
  });

  // Sort: modified first, then new, then unchanged — alphabetically within each group
  const order = { modified: 0, new: 1, unchanged: 2 };
  files.sort((a, b) => {
    const diff = order[a.status] - order[b.status];
    return diff !== 0 ? diff : a.relativePath.localeCompare(b.relativePath);
  });

  return files;
}

/**
 * Zips a folder (or a subset of files) into a zip archive.
 * @param {string} sourceFolder - Root folder path
 * @param {string} zipPath - Output zip file path
 * @param {string[]|null} selectedFiles - Optional list of relative paths to include.
 *   If null/undefined, all files are included.
 */
async function zipFolder(sourceFolder, zipPath, selectedFiles = null) {
  await fsp.mkdir(path.dirname(zipPath), { recursive: true });

  const selectedSet = selectedFiles
    ? new Set(selectedFiles.map((f) => f.replace(/\\/g, '/')))
    : null;

  await new Promise((resolve, reject) => {
    const output = fs.createWriteStream(zipPath);
    const archive = new ZipArchive({ zlib: { level: 9 } });
    output.on('close', resolve);
    output.on('error', reject);
    archive.on('error', reject);
    archive.pipe(output);

    if (selectedSet) {
      for (const relPath of selectedSet) {
        const absPath = path.join(sourceFolder, relPath);
        archive.file(absPath, { name: relPath });
      }
    } else {
      archive.glob('**/*', {
        cwd: sourceFolder,
        dot: true,
        ignore: ['node_modules/**', '.git/**'],
      });
    }

    archive.finalize();
  });

  const stat = await fsp.stat(zipPath);
  return {
    path: zipPath,
    size: stat.size,
    cleanup: async () => {
      await fsp.rm(zipPath, { force: true });
    },
  };
}

module.exports = { ensureFolder, hasChanges, diffFolder, zipFolder };
