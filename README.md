# MaxExec

**MaxExec** – MaxScript Development in VS Code  
Write and run MaxScript code directly from Visual Studio Code. This extension adds syntax highlighting, handy snippets, and the ability to send scripts straight to a running 3ds Max instance.  

[Get it on the VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=MCUnderground.maxexec)

---

## Features

- **3ds Max Instance Detection**  
  Automatically finds running 3ds Max instances so you can send scripts without manual setup.

- **Send Scripts to Max**  
  Send entire files or selected code directly to your chosen 3ds Max session.

- **Syntax Highlighting & Snippets**  
  Supports `.ms` and `.mcr` files, with useful snippets for functions, rollouts, structs, loops, and conditionals.

- **File Icons**  
  Adds icons for MaxScript-related file types for easier file browsing.

---

## Commands

| Command | Description |
|--------|-------------|
| `MaxExec: Select 3ds Max Instance` | Choose which running 3ds Max instance to target |
| `MaxExec: Send Full File to 3ds Max` | Sends the entire current file |
| `MaxExec: Send Selection to 3ds Max` | Sends only the selected code or current line |

### Keybindings

| Shortcut | Action |
|-----------|--------|
| `Ctrl+Shift+E` | Send full file |
| `Ctrl+Shift+S` | Send selection or current line |
| `Ctrl+Alt+E` | Select 3ds Max instance |

---

## Snippets

Quickly insert common MaxScript structures:

- Conditionals: `if`, `ifelse`, `ifdo`  
- Loops: `while`, `for`, `foreach`  
- Definitions: `fn`, `struct`, `rollout`  
- Switches: `case`  

Activate these snippets in files set to **MaxScript** mode.

---

## Requirements

- Autodesk 3ds Max must be running.  
- The included `maxexec-messanger.exe` tool is required to communicate with Max.

---

## Installation

1. Clone or download this extension.  
2. Run `npm install` and `npm run build`.  
3. Launch VS Code in Extension Development Host mode.  
4. Open a `.ms` or `.mcr` file and start coding.

---

## Troubleshooting

- **No 3ds Max instances found**: Make sure Max is running and not blocked by firewall or permissions.  
- **Script didn't execute**: The selected Max instance may have closed—reselect it using `MaxExec: Select 3ds Max Instance`.

---

## License

MIT

---

## Icon

![MaxExec Icon](images/icon.png)
