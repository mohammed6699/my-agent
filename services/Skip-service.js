import readLine from 'node:readline';
import chalk from 'chalk';


let skipRequested = false;
let keypressHandler = null;

export function startSkipListener(skipKey = 's') {
  skipRequested = false;
  if (process.stdin.isTTY) {
    // Some environments (e.g. piped input) don't support raw mode at all — fail gracefully rather than crash
    return;
  }
  readLine.emitKeypressEvents(process.stdin);
  process.stdin.setRawMode(true);

  keypressHandler = (str, key) => {
    if(key && key.ctrl && key.name === 'c'){
        process.exit()
    }
    if(str === skipKey){
        skipRequested = true;
        console.log(chalk.yellow(`\n[Skip requested — will stop after the current step finishes]`));
    }
  }
  process.stdin.on('keypress', keypressHandler);
}

// Call this right after runMyAgent returns (success, failure, or skipped) —
// restores normal terminal behavior so your next askQuestion prompt works.
export function stopSkipListener(){
    if(keypressHandler){
        process.stdin.removeListener('keypress', keypressHandler);
        keypressHandler = null;
    }
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(false);
    }
}
export function isSkipRequested() {
    return skipRequested;
}