import { ScrubbableControl } from '../../components/ScrubbableControl.js';
import { createControlGroup, updateAnimation } from './LegacyUtils.js';

export class LegacyAnimationSection {
    constructor(container, sectionStates) {
        this.container = container;
        this.sectionStates = sectionStates;
    }

    render(element, selection) {
        const { group, content } = createControlGroup('Animations', this.sectionStates, false);
        
        const animations = element.animations || { entrance: 'none', exit: 'none', duration: 1000, delay: 0 };

        // Entrance
        const entranceRow = document.createElement('div');
        entranceRow.className = 'control-row';
        
        const entranceLabel = document.createElement('label');
        entranceLabel.innerText = 'Entrance';
        
        const entranceSelect = document.createElement('select');
        entranceSelect.className = 'input-select';
        ['none', 'fade-in', 'slide-in-left', 'slide-in-right', 'slide-in-bottom', 'slide-in-top', 'zoom-in'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.innerText = opt.replace(/-/g, ' ');
            if (animations.entrance === opt) option.selected = true;
            entranceSelect.appendChild(option);
        });
        
        entranceSelect.onchange = (e) => {
            updateAnimation(selection, 'entrance', e.target.value);
        };
        
        entranceRow.appendChild(entranceLabel);
        entranceRow.appendChild(entranceSelect);
        content.appendChild(entranceRow);

        // Exit
        const exitRow = document.createElement('div');
        exitRow.className = 'control-row';
        
        const exitLabel = document.createElement('label');
        exitLabel.innerText = 'Exit';
        
        const exitSelect = document.createElement('select');
        exitSelect.className = 'input-select';
        ['none', 'fade-out', 'slide-out-left', 'slide-out-right', 'slide-out-bottom', 'slide-out-top', 'zoom-out'].forEach(opt => {
            const option = document.createElement('option');
            option.value = opt;
            option.innerText = opt.replace(/-/g, ' ');
            if (animations.exit === opt) option.selected = true;
            exitSelect.appendChild(option);
        });
        
        exitSelect.onchange = (e) => {
            updateAnimation(selection, 'exit', e.target.value);
        };
        
        exitRow.appendChild(exitLabel);
        exitRow.appendChild(exitSelect);
        content.appendChild(exitRow);

        // Duration & Delay
        const timingRow = document.createElement('div');
        timingRow.style.display = 'flex';
        timingRow.style.gap = '8px';
        timingRow.style.marginBottom = '8px';

        const durationControl = new ScrubbableControl('Duration', animations.duration || 1000, (val) => {
            updateAnimation(selection, 'duration', Math.max(0, val));
        });
        
        const delayControl = new ScrubbableControl('Delay', animations.delay || 0, (val) => {
            updateAnimation(selection, 'delay', Math.max(0, val));
        });

        timingRow.appendChild(durationControl.element);
        timingRow.appendChild(delayControl.element);
        content.appendChild(timingRow);

        // Preview Button
        const previewBtn = document.createElement('button');
        previewBtn.className = 'btn-secondary';
        previewBtn.innerText = 'Preview';
        previewBtn.style.width = '100%';
        previewBtn.onclick = () => {
            import('../../../core/AnimationManager.js').then(({ animationManager }) => {
                const domEl = document.getElementById(element.id);
                if (domEl) {
                    animationManager.playElementAnimation(domEl, animations);
                }
            });
        };
        content.appendChild(previewBtn);

        this.container.appendChild(group);
    }
}
