# Changelog

All notable changes to this project will be documented in this file.

## [1.2.1] - 2025-03-02
### Changed
- Removed internationalization support to simplify maintenance
- Applied code style fixes:
  - Added curly braces to single-line if and while statements
  - Improved code consistency

## [1.2.0] - 2025-02-28
### Changed
- Reverted creature movement logic to its original implementation for more natural swarm behavior
- Simplified codebase by removing complex group control mechanisms
- Focused on core creature behaviors (swarming, food response, mouse avoidance)
- Consolidated split movement modules back into a single implementation

## [1.1.1] - 2025-02-27
### Changed
- Unified status bar text to "禅" for all languages
- Improved fish movement animation:
  - Added smooth direction changes using inertia and target angles

## [1.1.0] - 2025-02-27
### Added
- Added internationalization (i18n) support:
  - English language support (default)
  - Japanese language support (日本語対応)

## [1.0.2] - 2025-02-27
### Added
- Added configuration options:
  - `otakZen.smallCreatureCount`: Configure the number of small creatures
  - `otakZen.koiCount`: Configure the number of koi fish
- Enhanced tooltip with live settings display and quick settings access

## [1.0.1] - 2025-02-27
### Added
- Additional files included in the package.

## [1.0.0] - 2025-02-27
### Added
- Initial release of otak-禅, a VS Code extension that provides a status bar button for launching a meditation Webview.
- The extension displays a button labeled "禅" that, when clicked, opens a Webview containing dynamic content from `src/zen.html`.
- Implemented core functionality in `src/extension.ts` to manage the status bar item and Webview.
- Integrated interactive animations using HTML5 Canvas that render a serene scene with fish animations.
- Documentation in README.md with usage, installation, and development instructions.

### Changed
- None.

### Fixed
- None.
