import * as vscode from 'vscode';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { execFile } from 'child_process';

let selectedMaxHandle: string | null = null;

export function activate(context: vscode.ExtensionContext) {
    const exePath = context.asAbsolutePath('data/maxexec-messanger.exe');

    context.subscriptions.push(
        vscode.commands.registerCommand('maxexec.selectInstance', () => {
            execFile(exePath, ['--list'], (err, stdout, stderr) => {
                if (err) {
                    vscode.window.showErrorMessage(`Error listing Max instances: ${stderr}`);
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

                vscode.window.showQuickPick(instances, { placeHolder: "Select 3ds Max instance" })
                    .then(selection => {
                        if (selection) {
                            selectedMaxHandle = selection.handle;
                            vscode.window.showInformationMessage(`Selected 3ds Max: ${selection.label}`);
                        }
                    });
            });
        }),

        vscode.commands.registerCommand('maxexec.sendFullFile', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !selectedMaxHandle) {
                vscode.window.showErrorMessage("No editor open or Max instance selected.");
                return;
            }

            const filePath = editor.document.fileName;
            sendToMax(exePath, selectedMaxHandle, filePath);
        }),

        vscode.commands.registerCommand('maxexec.sendSelection', () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor || !selectedMaxHandle) {
                vscode.window.showErrorMessage("No editor open or Max instance selected.");
                return;
            }

            const selection = editor.document.getText(editor.selection);
            if (!selection.trim()) {
                vscode.window.showWarningMessage("No text selected.");
                return;
            }

            const tempPath = path.join(os.tmpdir(), `maxexec-${Date.now()}.ms`);
            fs.writeFileSync(tempPath, selection, 'utf8');
            sendToMax(exePath, selectedMaxHandle, tempPath);
        })
    );
}

function sendToMax(exePath: string, handle: string, scriptPath: string) {
    execFile(exePath, ['--send', handle, scriptPath], (err, stdout, stderr) => {
        if (err) {
            vscode.window.showErrorMessage(`Failed to send script: ${stderr}`);
        } else {
            vscode.window.showInformationMessage(`Script sent to 3ds Max`);
        }
    });
}

export function deactivate() {}
