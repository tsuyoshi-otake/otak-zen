// The module 'vscode' contains the VS Code extensibility API
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    // ステータスバーアイテムの作成
    const zenButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    zenButton.text = "禅";

    // 設定値を取得して表示するツールチップを作成
    function updateTooltip() {
        const config = vscode.workspace.getConfiguration('otakZen');
        const smallCreatureCount = config.get('smallCreatureCount', 35);
        const koiCount = config.get('koiCount', 7);

        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = true;
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown('$(zen-mode) Zen Configuration\n\n---\n\n');
        tooltip.appendMarkdown(`small: ${smallCreatureCount}\n`);
        tooltip.appendMarkdown(`koi: ${koiCount}\n\n`);
        tooltip.appendMarkdown('$(gear) [Open Settings](command:workbench.action.openSettings?%22otakZen%22)');
        
        zenButton.tooltip = tooltip;
    }

    // 初期ツールチップを設定
    updateTooltip();

    // 設定変更時にツールチップを更新
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('otakZen')) {
                updateTooltip();
            }
        })
    );

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
            'Zen Time',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'zen')
                ]
            }
        );

        // 設定値を取得
        const config = vscode.workspace.getConfiguration('otakZen');
        const smallCreatureCount = config.get('smallCreatureCount', 35);
        const koiCount = config.get('koiCount', 7);

        // WebViewに設定値とコンテンツを渡す
        currentPanel.webview.html = getWebviewContent(context.extensionUri, currentPanel.webview);

        // 設定オブジェクトを注入
        currentPanel.webview.postMessage({
            command: 'updateCounts',
            smallCreatureCount: smallCreatureCount,
            koiCount: koiCount
        });

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

function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    // リソースのパスを取得
    const htmlPath = path.join(extensionUri.fsPath, 'src', 'zen', 'index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');

    // WebView内でのリソースパスを取得
    const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'zen', 'styles.css')
    );
    const mainScriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'zen', 'js', 'main.js')
    );

    // HTMLコンテンツを処理してリソースパスを更新
    return htmlContent
        .replace('href="styles.css"', `href="${stylesUri}"`)
        .replace('src="js/main.js"', `src="${mainScriptUri}"`);
}
