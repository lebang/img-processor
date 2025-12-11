const fs = require('fs');
const path = require('path');

/**
 * This is the definitive, final version of the afterPack hook script.
 * It correctly parses the context object provided by electron-builder based on
 * debug logs, and is compatible with both asar and non-asar packaging.
 * Its purpose is to remove all non-target-platform 'sharp' binaries.
 */
exports.default = async function(context) {
  // Definitive properties from debug log analysis.
  const { appOutDir, packager, arch: archId, electronPlatformName } = context;

  // Map architecture ID to the name used by sharp's directories.
  const archMap = { 3: 'arm64', 1: 'x64', 0: 'ia32' };
  const targetArch = archMap[archId];

  // 'electronPlatformName' directly provides 'darwin', 'win32', or 'linux'.
  const targetPlatform = electronPlatformName;

  if (!targetPlatform || !targetArch) {
      console.error(`[afterPack hook] CRITICAL ERROR: Could not determine target. platform='${targetPlatform}', arch='${targetArch}'`);
      process.exit(1);
  }

  console.log(`[afterPack hook] Cleaning binaries for FINAL target: platform=${targetPlatform}, arch=${targetArch}`);

  let resourcesDir;
  if (targetPlatform === 'darwin') {
    resourcesDir = path.join(appOutDir, `${packager.appInfo.productFilename}.app`, 'Contents', 'Resources');
  } else {
    resourcesDir = path.join(appOutDir, 'resources');
  }

  // Universal path logic to handle both asar and non-asar builds.
  const asarUnpackedPath = path.join(resourcesDir, 'app.asar.unpacked', 'node_modules', '@img');
  const plainAppPath = path.join(resourcesDir, 'app', 'node_modules', '@img');
  
  let sharpModulesDir;
  if (fs.existsSync(asarUnpackedPath)) {
    sharpModulesDir = asarUnpackedPath;
    console.log(`[afterPack hook] Found modules in ASAR unpacked directory: ${sharpModulesDir}`);
  } else if (fs.existsSync(plainAppPath)) {
    sharpModulesDir = plainAppPath;
    console.log(`[afterPack hook] Found modules in plain app directory: ${sharpModulesDir}`);
  } else {
    console.error(`[afterPack hook] CRITICAL ERROR: Could not find 'node_modules/@img' directory to clean.`);
    console.error(`[afterPack hook] Checked path (asar): ${asarUnpackedPath}`);
    console.error(`[afterPack hook] Checked path (no asar): ${plainAppPath}`);
    process.exit(1);
  }

  const keepPatterns = [
    `sharp-${targetPlatform}-${targetArch}`,
    `sharp-libvips-${targetPlatform}-${targetArch}`,
  ];
  console.log('[afterPack hook] Keeping patterns:', keepPatterns);

  const files = fs.readdirSync(sharpModulesDir);
  let deletedCount = 0;

  for (const file of files) {
    if (file.startsWith('sharp-') && !keepPatterns.some(p => file.startsWith(p))) {
      const dirToDelete = path.join(sharpModulesDir, file);
      console.log(`[afterPack hook] Deleting: ${file}`);
      try {
        fs.rmSync(dirToDelete, { recursive: true, force: true });
        deletedCount++;
      } catch (err) {
        console.error(`[afterPack hook] Failed to delete ${dirToDelete}:`, err);
      }
    }
  }

  if (deletedCount > 0) {
    console.log(`[afterPack hook] Success! Deleted ${deletedCount} unused sharp platform directories.`);
  } else {
    console.warn('[afterPack hook] Warning: No directories were deleted. The build may have already been clean.');
  }
};