import os
import subprocess
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

CONTROLS_JS = '''import { Store } from '../Store.js';

export const Controls = {
    async init() {
        console.log("Controls Module Initialized");
        await this.populateNativeDropdowns();
        this.buildCustomUI();
        this.bindEvents();
    },
    
    bindEvents() {
        // Universal event delegation for the custom UI
        document.addEventListener('click', (e) => {
            const trigger = e.target.closest('.seta-dropdown-trigger');
            if (trigger) {
                const wrap = trigger.closest('.seta-custom-select');
                // Close others first
                document.querySelectorAll('.seta-custom-select.open').forEach(el => {
                    if(el !== wrap) el.classList.remove('open');
                });
                wrap.classList.toggle('open');
                return;
            }
            
            const option = e.target.closest('.seta-dropdown-option');
            if (option) {
                const val = option.getAttribute('data-value');
                const wrap = option.closest('.seta-custom-select');
                const triggerText = wrap.querySelector('.seta-dropdown-trigger span');
                
                triggerText.innerText = option.innerText;
                wrap.classList.remove('open');
                
                if (val && val.length > 0 && !val.includes('Select')) {
                    console.log(`Custom UI caught change for: ${val}`);
                    Store.setAsset(val);
                }
                return;
            }
            
            // Close if clicking outside
            if (!e.target.closest('.seta-custom-select')) {
                document.querySelectorAll('.seta-custom-select').forEach(el => el.classList.remove('open'));
            }
        });
    },

    async populateNativeDropdowns() {
        const selects = document.querySelectorAll('select');
        if (selects.length === 0) return;

        try {
            const response = await fetch('./fix26_chart_store_member_index.json');
            let assets = [];
            if (response.ok) {
                const data = await response.json();
                assets = data && data.assets ? Object.keys(data.assets) : (!Array.isArray(data) ? Object.keys(data) : data);
            } else {
                assets = ["AAPL","AMD","AMZN","BTC","ETH","NVDA","SOL"];
            }

            selects.forEach(select => {
                const firstOption = select.querySelector('option');
                const placeholder = firstOption ? firstOption.outerHTML : '<option value="">Select Asset...</option>';
                const optionsHtml = assets.map(ticker => `<option value="${ticker}">${ticker}</option>`).join('');
                select.innerHTML = placeholder + optionsHtml;
            });
        } catch (error) {
            console.error("Controls: Failed to populate data:", error);
        }
    },

    buildCustomUI() {
        const selects = document.querySelectorAll('select');
        
        selects.forEach(select => {
            if (select.closest('.seta-custom-select')) return; // Already built

            select.style.display = 'none'; // Hide the ugly browser default
            
            const wrapper = document.createElement('div');
            wrapper.className = 'seta-custom-select';
            
            const trigger = document.createElement('div');
            trigger.className = 'seta-dropdown-trigger';
            trigger.innerHTML = `<span>${select.options[0].innerText}</span><span style="font-size: 0.8em; color: #8b949e;">▼</span>`;
            
            const optionsList = document.createElement('div');
            optionsList.className = 'seta-dropdown-options';
            
            Array.from(select.options).forEach((opt, index) => {
                if(index === 0) return; // Skip the placeholder in the list
                const optionEl = document.createElement('div');
                optionEl.className = 'seta-dropdown-option';
                optionEl.setAttribute('data-value', opt.value);
                optionEl.innerText = opt.innerText;
                optionsList.appendChild(optionEl);
            });
            
            wrapper.appendChild(trigger);
            wrapper.appendChild(optionsList);
            select.parentNode.insertBefore(wrapper, select.nextSibling);
        });
        
        // Inject missing styles dynamically to ensure parity
        if(!document.getElementById('seta-custom-ui-styles')) {
            const style = document.createElement('style');
            style.id = 'seta-custom-ui-styles';
            style.innerHTML = `
                .seta-custom-select { position: relative; display: inline-block; min-width: 220px; font-family: -apple-system, sans-serif; }
                .seta-dropdown-trigger { background: #161b22; border: 1px solid #30363d; color: #c9d1d9; padding: 12px 16px; border-radius: 6px; cursor: pointer; display: flex; justify-content: space-between; align-items: center; font-weight: 500; font-size: 14px; transition: 0.2s ease; }
                .seta-dropdown-trigger:hover { background: #21262d; border-color: #8b949e; }
                .seta-dropdown-options { display: none; position: absolute; top: calc(100% + 4px); left: 0; right: 0; background: #161b22; border: 1px solid #30363d; border-radius: 6px; z-index: 1000; max-height: 350px; overflow-y: auto; box-shadow: 0 8px 24px rgba(0,0,0,0.5); }
                .seta-custom-select.open .seta-dropdown-options { display: block; }
                .seta-dropdown-option { padding: 12px 16px; color: #c9d1d9; cursor: pointer; font-size: 14px; transition: 0.1s ease; border-bottom: 1px solid #21262d; }
                .seta-dropdown-option:last-child { border-bottom: none; }
                .seta-dropdown-option:hover { background: #1f6feb; color: white; }
            `;
            document.head.appendChild(style);
        }
    }
};
'''

def apply():
    print("Applying Stage 11: Restoring Custom UI Dropdowns...")
    (REPO_ROOT / "src" / "features" / "Controls.js").write_text(CONTROLS_JS, encoding="utf-8")
    
    subprocess.run(["git", "add", "."])
    subprocess.run(["git", "commit", "-m", "Refactor: Restore custom dark-theme UI for dropdown controls"])
    print("UI Restored! The dropdowns will now match production.")

if __name__ == "__main__":
    apply()