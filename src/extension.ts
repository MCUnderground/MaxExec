import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

let selectedMaxHandle: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    
    const exePath = context.asAbsolutePath('data/maxexec-messanger.exe');

        async function getAvailableInstances(): Promise<{ label: string, handle: string }[]> {
        return new Promise((resolve, reject) => {
            execFile(exePath, ['--list'], (err, stdout, stderr) => {
                if (err) {
                    reject(stderr);
                    return;
                }
                const instances = stdout
                    .split('\n')
                    .map(line => line.trim())
                    .filter(Boolean)
                    .map(line => {
                        const [handle, title] = line.split('|');
                        return { label: title, handle };
                    });
                resolve(instances);
            });
        });
    }

    async function ensureSelectedHandle() {
        if (selectedMaxHandle) {
            return selectedMaxHandle;
        }
        try {
            const instances = await getAvailableInstances();
            if (instances.length === 1) {
                selectedMaxHandle = instances[0].handle;
                vscode.window.showInformationMessage(`Automatically selected 3ds Max: ${instances[0].label}`);
                return selectedMaxHandle;
            } else if (instances.length > 1) {
                const pick = await vscode.window.showQuickPick(instances, { placeHolder: "Select 3ds Max instance" });
                if (pick) {
                    selectedMaxHandle = pick.handle;
                    vscode.window.showInformationMessage(`Selected 3ds Max: ${pick.label}`);
                    return selectedMaxHandle;
                }
            }
        } catch (err) {
            vscode.window.showErrorMessage(`Error listing Max instances: ${err}`);
        }
        return null;
    }

    context.subscriptions.push(
        vscode.commands.registerCommand('maxexec.selectInstance', async () => {
            try {
                const instances = await getAvailableInstances();
                if (instances.length === 0) {
                    vscode.window.showErrorMessage("No running 3ds Max instances found.");
                    return;
                }

                const pick = await vscode.window.showQuickPick(instances, { placeHolder: "Select 3ds Max instance" });
                if (pick) {
                    selectedMaxHandle = pick.handle;
                    vscode.window.showInformationMessage(`Selected 3ds Max: ${pick.label}`);
                }
            } catch (err) {
                vscode.window.showErrorMessage(`Error listing Max instances: ${err}`);
            }
        }),


        vscode.commands.registerCommand('maxexec.sendFullFile', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No editor open.");
                return;
            }
            if (editor.document.isUntitled) {
                vscode.window.showErrorMessage("Please save the file before sending.");
                return;
            }

            const handle = await ensureSelectedHandle();
            if (!handle) {
                vscode.window.showErrorMessage("No 3ds Max instance selected.");
                return;
            }

            const filePath = editor.document.fileName;
            console.log('File path:', filePath);
            sendToMax(exePath, handle, filePath);
        }),

        vscode.commands.registerCommand('maxexec.sendSelection', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage("No editor open.");
                return;
            }

            const handle = await ensureSelectedHandle();
            if (!handle) {
                vscode.window.showErrorMessage("No 3ds Max instance selected.");
                return;
            }

            let selection = editor.document.getText(editor.selection);

            if (!selection.trim()) {
                const currentLine = editor.document.lineAt(editor.selection.active.line);
                selection = currentLine.text;
                if (!selection.trim()) {
                    vscode.window.showWarningMessage("No selection or code on current line.");
                    return;
                }
            }


            const tempPath = path.join(os.tmpdir(), `maxexec-${Date.now()}.ms`);
            fs.writeFileSync(tempPath, selection, 'utf8');
            sendToMax(exePath, handle, tempPath);
        })
    );

    function normalizeDriveLetter(scriptPath: string): string {
    // Check for Windows drive letter (e.g., c:\ or d:/)
    if (/^[a-z]:/i.test(scriptPath)) {
        return scriptPath.charAt(0).toUpperCase() + scriptPath.slice(1);
    }
    return scriptPath;
    }

    function sendToMax(exePath: string, handle: string, scriptPath: string) {
        const fixedPath = normalizeDriveLetter(scriptPath);

        execFile(exePath, ['--send', handle, fixedPath], async (err, stdout, stderr) => {
            if (err) {
                const isWindowError = stderr?.includes("MXS_Scintilla");

                if (isWindowError) {
                    vscode.window.showWarningMessage("Selected 3ds Max is no longer running. Attempting to find another...");

                    selectedMaxHandle = null;
                    const fallbackHandle = await ensureSelectedHandle();

                    if (fallbackHandle) {
                        sendToMax(exePath, fallbackHandle, scriptPath); 
                    } else {
                        vscode.window.showErrorMessage("No valid 3ds Max instance found.");
                    }
                } else {
                    vscode.window.showErrorMessage(`Failed to send script: ${stderr}`);
                }
            } else {
                vscode.window.showInformationMessage(`Script sent to 3ds Max`);
            }
        });
    }
}





export function deactivate() {}
