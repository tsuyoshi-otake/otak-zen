// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // ステータスバーアイテムの作成
    const zenButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    zenButton.text = "禅";

    // 各行のMarkdownを作成
    const tooltipLines: vscode.MarkdownString[] = [];
    
    const line1 = new vscode.MarkdownString('$(zen-mode) 禅の時間');
    line1.isTrusted = true;
    line1.supportThemeIcons = true;
    tooltipLines.push(line1);

    // 空行
    tooltipLines.push(new vscode.MarkdownString(''));

    const line2 = new vscode.MarkdownString('$(gear) [設定を開く](command:workbench.action.openSettings?%22otakZen%22)');
    line2.isTrusted = true;
    line2.supportThemeIcons = true;
    tooltipLines.push(line2);

    // ツールチップを設定
    zenButton.tooltip = tooltipLines.join('\n');
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

        // 設定値を取得
        const config = vscode.workspace.getConfiguration('otakZen');
        const smallCreatureCount = config.get('smallCreatureCount', 35);
        const koiCount = config.get('koiCount', 7);

        // WebViewに設定値を渡す
        const html = getWebviewContent(context.extensionUri);
        currentPanel.webview.html = html.replace(
            '</head>',
            `<script>
                window.otakZen = {
                    smallCreatureCount: ${smallCreatureCount},
                    koiCount: ${koiCount}
                };
            </script>
            </head>`
        );

        currentPanel.onDidDispose(() => {
            currentPanel = undefined;
        });

        // 設定変更を監視して、WebViewを更新
        context.subscriptions.push(
            vscode.workspace.onDidChangeConfiguration(e => {
                if (currentPanel && e.affectsConfiguration('otakZen')) {
                    const newConfig = vscode.workspace.getConfiguration('otakZen');
                    const newSmallCreatureCount = newConfig.get('smallCreatureCount', 35);
                    const newKoiCount = newConfig.get('koiCount', 7);

                    currentPanel.webview.postMessage({
                        command: 'updateCounts',
                        smallCreatureCount: newSmallCreatureCount,
                        koiCount: newKoiCount
                    });
                }
            })
        );
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

function getWebviewContent(extensionUri: vscode.Uri): string {
    const htmlPath = path.join(extensionUri.fsPath, 'src', 'zen.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    return htmlContent;
}
