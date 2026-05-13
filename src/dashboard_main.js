import { Store } from './Store.js';
import { PlotlyRenderer } from './PlotlyRenderer.js';

// V2 Application Entry Point
document.addEventListener('DOMContentLoaded', async () => {
    console.log("SETA Dashboard V2 Modules Initialized");
    
    // Example: Listen for asset changes
    Store.on('assetChanged', (newAsset) => {
        console.log(`Loading new asset: ${newAsset}`);
        // Fetch and re-render logic goes here
    });
});
