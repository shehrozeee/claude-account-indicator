import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

interface Account {
  name: string;
  configDir: string;
}

function getAccounts(): Account[] {
  return vscode.workspace
    .getConfiguration('claudeAccountIndicator')
    .get<Account[]>('accounts', []);
}

function getActiveConfigDir(): string | undefined {
  // Priority 1: claude-code setting (set by in-extension switch + reload)
  const claudeConfig = vscode.workspace
    .getConfiguration('claude-code')
    .get<Record<string, string>>('environmentVariables', {});
  if (claudeConfig['CLAUDE_CONFIG_DIR']) {
    return claudeConfig['CLAUDE_CONFIG_DIR'];
  }

  // Priority 2: process env (set by PowerShell launcher)
  return process.env['CLAUDE_CONFIG_DIR'];
}

function resolveAccountName(configDir: string): string {
  const accounts = getAccounts();
  const match = accounts.find(
    (a) => a.configDir.toLowerCase() === configDir.toLowerCase()
  );
  if (match) {
    return match.name;
  }
  // Fallback: use folder name, strip leading dot
  return path.basename(configDir).replace(/^\./, '');
}

function updateStatusBar(item: vscode.StatusBarItem): void {
  const configDir = getActiveConfigDir();
  if (configDir) {
    const name = resolveAccountName(configDir);
    item.text = `$(account) Claude: ${name}`;
    item.tooltip = `CLAUDE_CONFIG_DIR: ${configDir}\nClick to switch account`;
    item.color = undefined;
  } else {
    item.text = `$(account) Claude: not set`;
    item.tooltip = 'CLAUDE_CONFIG_DIR is not set.\nClick to switch account or add accounts in settings.';
    item.color = new vscode.ThemeColor('statusBarItem.warningForeground');
  }
}

function ensureIdeJunction(configDir: string): void {
  const userProfile = process.env['USERPROFILE'];
  if (!userProfile) {
    return;
  }

  const junctionPath = path.join(configDir, 'ide');
  const junctionTarget = path.join(userProfile, '.claude', 'ide');

  if (!fs.existsSync(junctionPath)) {
    try {
      if (!fs.existsSync(junctionTarget)) {
        fs.mkdirSync(junctionTarget, { recursive: true });
      }
      fs.mkdirSync(configDir, { recursive: true });
      execSync(`cmd /c mklink /J "${junctionPath}" "${junctionTarget}"`, { stdio: 'pipe' });
    } catch {
      // Non-fatal — junction is a nice-to-have
    }
  }
}

async function addAccount(): Promise<Account | undefined> {
  const name = await vscode.window.showInputBox({
    title: 'Add Claude Account — Step 1 of 2',
    prompt: 'Account name (e.g. Personal, Work, Client A)',
    placeHolder: 'Personal',
    validateInput: (v) => (v.trim() ? undefined : 'Name cannot be empty'),
  });
  if (!name) {
    return undefined;
  }

  const userProfile = process.env['USERPROFILE'] ?? 'C:\\Users\\you';
  const configDir = await vscode.window.showInputBox({
    title: 'Add Claude Account — Step 2 of 2',
    prompt: 'Path to CLAUDE_CONFIG_DIR for this account',
    placeHolder: `${userProfile}\\.claude-${name.toLowerCase()}`,
    validateInput: (v) => (v.trim() ? undefined : 'Path cannot be empty'),
  });
  if (!configDir) {
    return undefined;
  }

  return { name: name.trim(), configDir: configDir.trim() };
}

async function switchAccount(statusBar: vscode.StatusBarItem): Promise<void> {
  const accounts = getAccounts();
  const activeDir = getActiveConfigDir();

  type PickItem = vscode.QuickPickItem & { account?: Account; isAdd?: boolean };

  const picks: PickItem[] = accounts.map((a) => ({
    label: `$(account) ${a.name}`,
    description: a.configDir,
    detail: a.configDir.toLowerCase() === activeDir?.toLowerCase() ? '$(check) Active' : undefined,
    account: a,
  }));

  picks.push({ label: '', kind: vscode.QuickPickItemKind.Separator } as PickItem);
  picks.push({ label: '$(add) Add account...', isAdd: true });

  const selected = await vscode.window.showQuickPick(picks, {
    title: 'Claude Account Indicator',
    placeHolder: accounts.length
      ? 'Select an account to switch to'
      : 'No accounts configured — add one',
  });

  if (!selected) {
    return;
  }

  if (selected.isAdd) {
    const newAccount = await addAccount();
    if (!newAccount) {
      return;
    }

    const config = vscode.workspace.getConfiguration('claudeAccountIndicator');
    const existing = config.get<Account[]>('accounts', []);
    await config.update(
      'accounts',
      [...existing, newAccount],
      vscode.ConfigurationTarget.Global
    );

    vscode.window.showInformationMessage(
      `Account "${newAccount.name}" added. Switch to it from the status bar.`
    );
    return;
  }

  if (!selected.account) {
    return;
  }

  const target = selected.account;

  if (target.configDir.toLowerCase() === activeDir?.toLowerCase()) {
    vscode.window.showInformationMessage(`Already using account: ${target.name}`);
    return;
  }

  // Create ide junction (best-effort)
  ensureIdeJunction(target.configDir);

  // Update claude-code.environmentVariables
  try {
    const claudeConfig = vscode.workspace.getConfiguration('claude-code');
    const existing = claudeConfig.get<Record<string, string>>('environmentVariables', {});
    await claudeConfig.update(
      'environmentVariables',
      { ...existing, CLAUDE_CONFIG_DIR: target.configDir },
      vscode.ConfigurationTarget.Global
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    vscode.window.showErrorMessage(`Claude Account Indicator: Failed to update settings: ${msg}`);
    return;
  }

  updateStatusBar(statusBar);

  const action = await vscode.window.showInformationMessage(
    `Switched to "${target.name}". Reload window to apply?`,
    'Reload Window',
    'Later'
  );

  if (action === 'Reload Window') {
    await vscode.commands.executeCommand('workbench.action.reloadWindow');
  }
}

export function activate(context: vscode.ExtensionContext): void {
  const statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'claudeAccountIndicator.switch';
  statusBar.show();
  context.subscriptions.push(statusBar);

  updateStatusBar(statusBar);

  // Refresh status bar if settings change
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (
        e.affectsConfiguration('claudeAccountIndicator.accounts') ||
        e.affectsConfiguration('claude-code.environmentVariables')
      ) {
        updateStatusBar(statusBar);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('claudeAccountIndicator.switch', () =>
      switchAccount(statusBar)
    )
  );
}

export function deactivate(): void {}
