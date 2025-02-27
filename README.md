<p align="center">
  <h1 align="center">otak-禅</h1>
  <p align="center">Calm your mind with a fish school meditation VS Code extension</p>
</p>

---

This project provides the VS Code extension "otak-禅".  
The extension adds a customizable status bar button to VS Code. When clicked, it launches a Webview displaying "禅の時間" (Meditation Time).  
The Webview content is defined in `src/zen.html` and dynamically renders a serene scene of fish swimming, creating a meditative atmosphere with interactive elements.

## Key Features
- **Status Bar Display**  
  A button labeled "禅" appears in the bottom right corner with a tooltip "Display fish school meditation mode".
- **Webview Display**  
  When triggered, the extension (as managed in `src/extension.ts`) opens a Webview which loads the content from `src/zen.html`.  
  - Uses HTML5 canvas to render dynamic animations of fish.
  - Interactive elements respond to mouse movements to alter the fish motion.

## Usage
1. Launch VS Code and install the extension.
2. Click the "禅" button in the status bar to open the Webview.
3. In the Webview, enjoy the animated scene of fish along with interactive feeding actions.

## Installation
1. Clone this repository.
2. Run the following command to install the dependencies:
   ```powershell
   npm install
   ```
3. Restart VS Code to load the extension.

## Development
- **Main Extension Code:** `src/extension.ts`  
  Uses the VS Code API to create the "禅" status bar button and manage the Webview display.
- **Webview Content:** `src/zen.html`  
  Contains the HTML and JavaScript to generate the dynamic, animated meditation scene with fish.

## Demo
After installation, click the "禅" button in the status bar to experience the serene fish meditation in action.

## License
[MIT](LICENSE)