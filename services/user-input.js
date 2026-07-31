import boxen from 'boxen';
import chalk from 'chalk';
export function promptBox(text) {
    return boxen(chalk.cyan('❯ ') + chalk.white(text), {
        padding: { left: 1, right: 1, top: 0, bottom: 0 },
        margin: { top: 1, bottom: 0 },
        borderStyle: 'round',
        borderColor: 'cyan',
    });
}