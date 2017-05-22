'use strict';

const fs = require('fs-extra');
const nyanProgress = require('nyan-progress');
const tmp = require('tmp');
const chalk = require('chalk');
const disk = require('diskusage');
const os = require('os')

let isComplete = false;

tmp.setGracefulCleanup();
const tmpDir = tmp.dirSync({
  prefix: 'yarn-create-problem-',
  unsafeCleanup: true,
});

let path = os.platform() === 'win32' ? 'c:' : '/';
let lastDiskData = getDiskSpace();

const progress = nyanProgress();
progress.start({
  curr: lastDiskData.used,
  total: lastDiskData.total,
  width: 60,
  message: {
    downloading: [
      '\n' +
      chalk.red('Your new problem will be a Fat Directory by following path: ')  +
      '\n' +
      tmpDir.name +
      '\n' +
      chalk.red('Please wait while it eats all your free disk space...') +
      '\n'
    ],
    finished: '\n\n\n\nFinished'
  },
 });

const timer = setInterval(() => {
  const tmp = getDiskSpace();
  const inc = tmp.used - lastDiskData.used;
  lastDiskData = tmp;

  createFileWithZeros();
  progress.tick(inc);

  if (progress.isComplete || isComplete) {
    clearInterval(timer);
  }
}, 100);


function getDiskSpace() {
  let info = disk.checkSync(path);
  const free = Math.max(info.available, info.free);
  const total = info.total;
  const used = total - free;
  const usedInPercent = Math.round(used/total * 100);
  return {
    free,
    total,
    used,
    usedInPercent,
  };
}

let isWritingFile = false;
function createFileWithZeros(size) {
  if (isWritingFile) return;
  isWritingFile = true;

  const tmpobj = tmp.fileSync({
    dir: tmpDir.name,
    prefix: 'yarn-create-problem-',
    postfix: '.txt',
    keep: true,
  });
  fs.writeSync(tmpobj.fd, Buffer.alloc(size || 100000000, 0));
  fs.close(tmpobj.fd);

  isWritingFile = false;
}

function cleanUp() {
  tmpDir.removeCallback();
  progress.interupt();
  isComplete = true;
  process.exit(0);
}

// when app is closing
process.on('exit', () => cleanUp());
// catches ctrl+c event
process.on('SIGINT', () => cleanUp());
// catches uncaught exceptions
process.on('uncaughtException', () => cleanUp());
