import * as vscode from 'vscode';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface ZenConfiguration {
    smallCreatureCount: number;
    koiCount: number;
}

const ZEN_CONFIGURATION_LIMITS = {
    smallCreatureCount: { defaultValue: 35, min: 1, max: 100 },
    koiCount: { defaultValue: 7, min: 1, max: 20 },
} as const;

export function activate(context: vscode.ExtensionContext) {
    const zenButton = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    zenButton.text = '禅';
    zenButton.command = 'otak-zen.toggleZen';

    function updateTooltip() {
        const settings = getZenConfiguration();

        const tooltip = new vscode.MarkdownString();
        tooltip.isTrusted = {
            enabledCommands: ['workbench.action.openSettings'],
        };
        tooltip.supportThemeIcons = true;
        tooltip.appendMarkdown('$(zen-mode) Zen Configuration\n\n---\n\n');
        tooltip.appendMarkdown(`small: ${settings.smallCreatureCount}\n`);
        tooltip.appendMarkdown(`koi: ${settings.koiCount}\n\n`);
        tooltip.appendMarkdown('$(gear) [Open Settings](command:workbench.action.openSettings?%22otakZen%22)');

        zenButton.tooltip = tooltip;
    }

    updateTooltip();
    zenButton.show();
    context.subscriptions.push(zenButton);

    let currentPanel: vscode.WebviewPanel | undefined;

    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('otakZen')) {
                updateTooltip();
                if (currentPanel) {
                    postZenConfiguration(currentPanel);
                }
            }
        })
    );

    const disposable = vscode.commands.registerCommand('otak-zen.toggleZen', () => {
        if (currentPanel) {
            currentPanel.dispose();
            return;
        }

        currentPanel = vscode.window.createWebviewPanel(
            'zenView',
            'Zen Time',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'zen')
                ]
            }
        );

        const panel = currentPanel;
        const panelDisposables: vscode.Disposable[] = [];

        panel.webview.html = getWebviewContent(context.extensionUri, panel.webview);
        panel.webview.onDidReceiveMessage(message => {
            if (isReadyMessage(message)) {
                postZenConfiguration(panel);
            }
        }, undefined, panelDisposables);

        panel.onDidDispose(() => {
            for (const disposable of panelDisposables) {
                disposable.dispose();
            }
            currentPanel = undefined;
        }, null, panelDisposables);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}

export function getZenConfiguration(): ZenConfiguration {
    const config = vscode.workspace.getConfiguration('otakZen');

    return normalizeZenConfiguration({
        smallCreatureCount: config.get('smallCreatureCount'),
        koiCount: config.get('koiCount'),
    });
}

export function normalizeZenConfiguration(values: {
    smallCreatureCount?: unknown;
    koiCount?: unknown;
}): ZenConfiguration {
    return {
        smallCreatureCount: clampCount(
            values.smallCreatureCount,
            ZEN_CONFIGURATION_LIMITS.smallCreatureCount.defaultValue,
            ZEN_CONFIGURATION_LIMITS.smallCreatureCount.min,
            ZEN_CONFIGURATION_LIMITS.smallCreatureCount.max
        ),
        koiCount: clampCount(
            values.koiCount,
            ZEN_CONFIGURATION_LIMITS.koiCount.defaultValue,
            ZEN_CONFIGURATION_LIMITS.koiCount.min,
            ZEN_CONFIGURATION_LIMITS.koiCount.max
        ),
    };
}

export function getWebviewContent(extensionUri: vscode.Uri, webview: vscode.Webview): string {
    const htmlPath = vscode.Uri.joinPath(extensionUri, 'src', 'zen', 'index.html').fsPath;
    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    const stylesUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'zen', 'styles.css')
    );
    const mainScriptUri = webview.asWebviewUri(
        vscode.Uri.joinPath(extensionUri, 'src', 'zen', 'js', 'main.js')
    );
    const nonce = createNonce();

    return renderWebviewHtml(
        htmlContent,
        stylesUri.toString(),
        mainScriptUri.toString(),
        webview.cspSource,
        nonce
    );
}

export function renderWebviewHtml(
    htmlContent: string,
    stylesUri: string,
    mainScriptUri: string,
    cspSource: string,
    nonce: string
): string {
    return htmlContent
        .replaceAll('{{cspSource}}', cspSource)
        .replaceAll('{{nonce}}', nonce)
        .replace('href="styles.css"', `href="${stylesUri}"`)
        .replace('src="js/main.js"', `src="${mainScriptUri}"`);
}

function postZenConfiguration(panel: vscode.WebviewPanel): Thenable<boolean> {
    return panel.webview.postMessage({
        command: 'updateCounts',
        ...getZenConfiguration(),
    });
}

function clampCount(value: unknown, defaultValue: number, min: number, max: number): number {
    const numberValue = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(numberValue)) {
        return defaultValue;
    }

    return Math.min(max, Math.max(min, Math.floor(numberValue)));
}

function createNonce(): string {
    return crypto.randomBytes(16).toString('base64');
}

function isReadyMessage(message: unknown): message is { command: 'ready' } {
    return typeof message === 'object'
        && message !== null
        && 'command' in message
        && (message as { command?: unknown }).command === 'ready';
}
