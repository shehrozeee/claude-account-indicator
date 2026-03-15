import * as vscode from 'vscode';
import * as path from 'path';

function getAccountLabel(configDir: string | undefined): { label: string; color: vscode.ThemeColor } {
  if (!configDir) {
    return { label: 'Claude: unknown', color: new vscode.ThemeColor('statusBarItem.warningForeground') };
  }

  const dir = path.basename(configDir).toLowerCase();

  if (dir.includes('personal')) {
    return { label: '$(account) Claude: Personal', color: new vscode.ThemeColor('statusBarItem.foreground') };
  }
  if (dir.includes('work')) {
    return { label: '$(briefcase) Claude: Work', color: new vscode.ThemeColor('statusBarItem.foreground') };
  }

  return { label: `$(account) Claude: ${path.basename(configDir)}`, color: new vscode.ThemeColor('statusBarItem.foreground') };
}

export function activate(context: vscode.ExtensionContext): void {
  const configDir = process.env['CLAUDE_CONFIG_DIR'];
  const { label, color } = getAccountLabel(configDir);

  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.text = label;
  statusBar.color = color;
  statusBar.tooltip = configDir
    ? `CLAUDE_CONFIG_DIR: ${configDir}`
    : 'CLAUDE_CONFIG_DIR is not set — launch VS Code via claude-p or claude-w';
  statusBar.show();

  context.subscriptions.push(statusBar);
}

export function deactivate(): void {}
