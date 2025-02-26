// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // ステータスバーアイテムの作成
    const zenButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    zenButton.text = "禅";
    zenButton.tooltip = "魚群の禅モードを表示";
    zenButton.command = 'otak-zen.toggleZen';
    zenButton.show();
    context.subscriptions.push(zenButton);

    let currentPanel: vscode.WebviewPanel | undefined = undefined;

    const disposable = vscode.commands.registerCommand('otak-zen.toggleZen', () => {
        if (currentPanel) {
            currentPanel.dispose();
            currentPanel = undefined;
            return;
        }

        currentPanel = vscode.window.createWebviewPanel(
            'zenView',
            '禅の時間',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        currentPanel.webview.html = getWebviewContent(context.extensionUri);

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(extensionUri: vscode.Uri): string {
    const htmlPath = path.join(extensionUri.fsPath, 'src', 'zen.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}
