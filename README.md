# Claude Account Indicator — VS Code Extension

A VS Code extension that shows the active Claude Code account in the status bar and lets you switch between accounts without touching the terminal.

[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GitHub Release](https://img.shields.io/github/v/release/shehrozeee/claude-account-indicator)](https://github.com/shehrozeee/claude-account-indicator/releases)

## The Problem

When running multiple Claude Code accounts (Personal, Work, Client, etc.), all VS Code windows look identical — there's no way to tell at a glance which account is active, and switching requires closing and relaunching VS Code.

## Features

- **Status bar indicator** — shows `Claude: Personal`, `Claude: Work`, or any account name you configure
- **In-extension switching** — click the status bar item to switch accounts with a reload prompt
- **Unlimited accounts** — configure as many accounts as you need
- **Add accounts on the fly** — no need to edit settings manually; use the "Add account..." option in the quick pick
- **Dual detection** — reads active account from `claude-code.environmentVariables` (after in-extension switch) or `CLAUDE_CONFIG_DIR` process env (after PowerShell launch), in that order

## Setup

### 1. Create credential directories

Create a separate config directory for each account:

```powershell
# These will be created automatically on first login
# Personal:  %USERPROFILE%\.claude-personal
# Work:      %USERPROFILE%\.claude-work
```

### 2. Add PowerShell launcher functions

Add the following to your PowerShell `$PROFILE` (`notepad $PROFILE`):

```powershell
# VS Code — launch with account-specific CLAUDE_CONFIG_DIR
function code-p {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-personal"
    code $args
    $env:CLAUDE_CONFIG_DIR = $null
}

function code-w {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-work"
    code $args
    $env:CLAUDE_CONFIG_DIR = $null
}

# Claude CLI — run with account-specific CLAUDE_CONFIG_DIR
function claude-p {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-personal"
    claude $args
    $env:CLAUDE_CONFIG_DIR = $null
}

function claude-w {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-work"
    claude $args
    $env:CLAUDE_CONFIG_DIR = $null
}
```

Reload your profile: `. $PROFILE`

### 3. Log in to each account (one-time)

```powershell
code-p    # opens VS Code → run "claude login" inside terminal → log in with Personal account
code-w    # opens VS Code → run "claude login" inside terminal → log in with Work account
```

### 4. Install the extension

Download the latest `.vsix` from [Releases](../../releases) and install:

```powershell
code --install-extension claude-account-indicator-*.vsix
```

Or install from the VS Code Marketplace (search **Claude Account Indicator**).

### 5. Configure your accounts

Add your accounts to VS Code settings (`Ctrl+,` → search `claudeAccountIndicator`):

```json
"claudeAccountIndicator.accounts": [
  { "name": "Personal", "configDir": "C:\\Users\\you\\.claude-personal" },
  { "name": "Work",     "configDir": "C:\\Users\\you\\.claude-work" }
]
```

Or click the status bar item and choose **"+ Add account..."**.

## Usage

| Command | What it does |
|---|---|
| `code-p [path]` | Open VS Code with Personal Claude account |
| `code-w [path]` | Open VS Code with Work Claude account |
| `claude-p` | Run Claude CLI as Personal account |
| `claude-w` | Run Claude CLI as Work account |
| Click status bar | Switch account or add a new one |

## How It Works

- **PowerShell launchers** set `CLAUDE_CONFIG_DIR` as a process environment variable before launching VS Code or the Claude CLI
- **In-extension switching** updates `claude-code.environmentVariables.CLAUDE_CONFIG_DIR` in your user `settings.json` and reloads the window
- **Status bar** matches the active `CLAUDE_CONFIG_DIR` against your configured account list to show the friendly name

## Built on Top of

This extension is a companion to **[tannyusuf/switch-claude-code-accounts](https://github.com/tannyusuf/switch-claude-code-accounts)** — a collection of PowerShell scripts for switching between Claude Code accounts across VS Code, Cursor, Windsurf, and Antigravity on Windows.

All credit for the account switching approach goes to the original authors.

## License

MIT — see [LICENSE](LICENSE)
