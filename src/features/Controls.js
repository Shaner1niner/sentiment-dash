import { Store } from '../Store.js';

export const Controls = {
    init() {
        console.log("Controls Module Initialized (Universal Listener)");
        this.bindEvents();
    },
    
    bindEvents() {
        // Listen to ANY dropdown change on the page
        document.addEventListener('change', (e) => {
            if (e.target.tagName.toLowerCase() === 'select') {
                const val = e.target.value;
                if (val && val.length > 0 && val !== 'Select Asset') {
                    console.log(`Dropdown caught change for: ${val}`);
                    Store.setAsset(val);
                }
            }
        });
    }
};
