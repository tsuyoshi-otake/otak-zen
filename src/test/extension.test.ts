import * as assert from 'assert';
import { normalizeZenConfiguration, renderWebviewHtml } from '../extension';

suite('Extension Test Suite', () => {
    test('clamps creature configuration to contributed bounds', () => {
        assert.deepStrictEqual(
            normalizeZenConfiguration({
                smallCreatureCount: 500,
                koiCount: -4,
            }),
            {
                smallCreatureCount: 100,
                koiCount: 1,
            }
        );
    });

    test('falls back to defaults for invalid creature configuration', () => {
        assert.deepStrictEqual(
            normalizeZenConfiguration({
                smallCreatureCount: 'not-a-number',
                koiCount: Number.NaN,
            }),
            {
                smallCreatureCount: 35,
                koiCount: 7,
            }
        );
    });

    test('injects webview resource URIs and CSP nonce', () => {
        const html = renderWebviewHtml(
            [
                '<meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src {{cspSource}}; script-src \'nonce-{{nonce}}\' {{cspSource}};">',
                '<link rel="stylesheet" href="styles.css">',
                '<script type="module" nonce="{{nonce}}" src="js/main.js"></script>',
            ].join('\n'),
            'vscode-resource://styles.css',
            'vscode-resource://main.js',
            'vscode-webview-resource',
            'nonce-value'
        );

        assert.ok(html.includes('style-src vscode-webview-resource'));
        assert.ok(html.includes('script-src \'nonce-nonce-value\' vscode-webview-resource'));
        assert.ok(html.includes('href="vscode-resource://styles.css"'));
        assert.ok(html.includes('nonce="nonce-value" src="vscode-resource://main.js"'));
    });
});
