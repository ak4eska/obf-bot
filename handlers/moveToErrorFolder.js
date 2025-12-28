const fs = require('fs');
const path = require('path');

function moveToErrorFolder(filePath) {
  const errorDir = path.join(process.cwd(), 'cache', 'error');

  if (!fs.existsSync(errorDir)) {
    fs.mkdirSync(errorDir, { recursive: true });
  }

  const fileName = path.basename(filePath);
  fs.renameSync(filePath, path.join(errorDir, fileName));
}

module.exports = moveToErrorFolder;