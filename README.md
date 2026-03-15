# Claude Account Indicator — VS Code Extension

A VS Code status bar extension that shows which Claude Code account is active in the current window.

![Status bar showing "Claude: Personal" or "Claude: Work"](https://img.shields.io/badge/status%20bar-Claude%3A%20Personal%20%7C%20Work-blue)
[![Platform](https://img.shields.io/badge/platform-Windows-blue.svg)](https://www.microsoft.com/windows)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

## The Problem

When switching between Personal and Work Claude Code accounts using PowerShell launchers, all VS Code windows look identical — there's no way to tell at a glance which account is active.

## The Solution

This extension reads `CLAUDE_CONFIG_DIR` from the environment at startup and displays it in the status bar:

- `$(account) Claude: Personal` — launched via `claude-p`
- `$(briefcase) Claude: Work` — launched via `claude-w`
- `Claude: unknown` — launched without `CLAUDE_CONFIG_DIR` set (e.g. from taskbar or context menu)

## Built on Top of

This extension is a companion to **[tannyusuf/switch-claude-code-accounts](https://github.com/tannyusuf/switch-claude-code-accounts)** — a collection of PowerShell scripts for switching between Personal and Work Claude Code accounts across VS Code, Cursor, Windsurf, and Antigravity on Windows.

All credit for the account switching approach goes to the original authors. This extension simply adds a visual indicator to complete the workflow.

## Setup

### 1. Set up account switching (from the original repo)

Follow the setup instructions at [tannyusuf/switch-claude-code-accounts](https://github.com/tannyusuf/switch-claude-code-accounts) to install the PowerShell switcher functions.

For VS Code with short aliases, add to your PowerShell `$PROFILE`:

```powershell
function claude-p {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-personal"
    code $args
    $env:CLAUDE_CONFIG_DIR = $null
}

function claude-w {
    $env:CLAUDE_CONFIG_DIR = "$HOME\.claude-work"
    code $args
    $env:CLAUDE_CONFIG_DIR = $null
}
```

### 2. Install the extension

Download the latest `.vsix` from [Releases](../../releases) and install:

```powershell
code --install-extension claude-account-indicator-*.vsix
```

Or build from source (see below).

### 3. Launch VS Code via the switcher

```powershell
claude-p          # Personal account — status bar shows "Claude: Personal"
claude-w          # Work account — status bar shows "Claude: Work"
```

## Build from Source

```powershell
npm install
npm run package
code --install-extension claude-account-indicator-*.vsix
```

Requires Node.js and `@vscode/vsce` (`npm install -g @vscode/vsce`).

## How It Works

The extension reads `process.env.CLAUDE_CONFIG_DIR` once at activation and sets the status bar text based on the directory name. It's intentionally read-only — account switching is handled by relaunching VS Code via the PowerShell functions.

## License

MIT — see [LICENSE](LICENSE)

## Credits

- Account switching approach: [tannyusuf/switch-claude-code-accounts](https://github.com/tannyusuf/switch-claude-code-accounts)
