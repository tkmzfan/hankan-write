// Drag and Resize Panel System
class DragResizePanel {
    constructor(panelId, headerSelector = '.exercise-header h3') {
        this.panel = document.getElementById(panelId);
        this.header = this.panel.querySelector(headerSelector);
        this.isDragging = false;
        this.isResizing = false;
        this.startX = 0;
        this.startY = 0;
        this.startLeft = 0;
        this.startTop = 0;
        this.startWidth = 0;
        this.startHeight = 0;
        this.resizeHandle = null;
        
        this.init();
    }
    
    init() {
        this.createResizeHandles();
        this.attachDragListeners();
        this.attachResizeListeners();
        this.loadPosition();
        
        // Make header cursor indicate draggable
        if (this.header) {
            this.header.style.cursor = 'move';
            this.header.style.userSelect = 'none';
        }
    }
    
    createResizeHandles() {
        // Create resize handles
        const handles = ['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'];
        
        handles.forEach(direction => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${direction}`;
            handle.style.position = 'absolute';
            handle.style.zIndex = '1002';
            
            // Set handle positions and cursors
            switch(direction) {
                case 'nw':
                    handle.style.top = '-5px';
                    handle.style.left = '-5px';
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.cursor = 'nw-resize';
                    break;
                case 'ne':
                    handle.style.top = '-5px';
                    handle.style.right = '-5px';
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.cursor = 'ne-resize';
                    break;
                case 'sw':
                    handle.style.bottom = '-5px';
                    handle.style.left = '-5px';
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.cursor = 'sw-resize';
                    break;
                case 'se':
                    handle.style.bottom = '-5px';
                    handle.style.right = '-5px';
                    handle.style.width = '10px';
                    handle.style.height = '10px';
                    handle.style.cursor = 'se-resize';
                    break;
                case 'n':
                    handle.style.top = '-3px';
                    handle.style.left = '10px';
                    handle.style.right = '10px';
                    handle.style.height = '6px';
                    handle.style.cursor = 'n-resize';
                    break;
                case 's':
                    handle.style.bottom = '-3px';
                    handle.style.left = '10px';
                    handle.style.right = '10px';
                    handle.style.height = '6px';
                    handle.style.cursor = 's-resize';
                    break;
                case 'e':
                    handle.style.right = '-3px';
                    handle.style.top = '10px';
                    handle.style.bottom = '10px';
                    handle.style.width = '6px';
                    handle.style.cursor = 'e-resize';
                    break;
                case 'w':
                    handle.style.left = '-3px';
                    handle.style.top = '10px';
                    handle.style.bottom = '10px';
                    handle.style.width = '6px';
                    handle.style.cursor = 'w-resize';
                    break;
            }
            
            handle.style.backgroundColor = 'rgba(0, 123, 255, 0.3)';
            handle.style.border = '1px solid #007bff';
            handle.style.opacity = '0';
            handle.style.transition = 'opacity 0.2s ease';
            
            this.panel.appendChild(handle);
        });
        
        // Show handles on hover
        this.panel.addEventListener('mouseenter', () => {
            this.panel.querySelectorAll('.resize-handle').forEach(handle => {
                handle.style.opacity = '1';
            });
        });
        
        this.panel.addEventListener('mouseleave', () => {
            if (!this.isResizing && !this.isDragging) {
                this.panel.querySelectorAll('.resize-handle').forEach(handle => {
                    handle.style.opacity = '0';
                });
            }
        });
    }
    
    attachDragListeners() {
        if (!this.header) return;
        
        this.header.addEventListener('mousedown', (e) => {
            if (e.target.closest('.resize-handle')) return;
            
            this.isDragging = true;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startLeft = parseInt(getComputedStyle(this.panel).left) || 0;
            this.startTop = parseInt(getComputedStyle(this.panel).top) || 0;
            
            this.panel.style.zIndex = '1003';
            this.panel.classList.add('dragging');
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        // Double-click to reset position
        this.header.addEventListener('dblclick', (e) => {
            if (e.target.closest('.resize-handle')) return;
            this.resetPosition();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            
            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;
            
            this.panel.style.left = (this.startLeft + deltaX) + 'px';
            this.panel.style.top = (this.startTop + deltaY) + 'px';
            this.panel.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isDragging) {
                this.isDragging = false;
                this.panel.style.zIndex = '1000';
                this.panel.classList.remove('dragging');
                document.body.style.userSelect = '';
                this.savePosition();
            }
        });
    }
    
    attachResizeListeners() {
        this.panel.addEventListener('mousedown', (e) => {
            if (!e.target.classList.contains('resize-handle')) return;
            
            this.isResizing = true;
            this.resizeHandle = e.target;
            this.startX = e.clientX;
            this.startY = e.clientY;
            this.startWidth = parseInt(getComputedStyle(this.panel).width);
            this.startHeight = parseInt(getComputedStyle(this.panel).height);
            this.startLeft = parseInt(getComputedStyle(this.panel).left) || 0;
            this.startTop = parseInt(getComputedStyle(this.panel).top) || 0;
            
            this.panel.classList.add('resizing');
            document.body.style.userSelect = 'none';
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!this.isResizing) return;
            
            const deltaX = e.clientX - this.startX;
            const deltaY = e.clientY - this.startY;
            const handleClass = this.resizeHandle.className;
            
            let newWidth = this.startWidth;
            let newHeight = this.startHeight;
            let newLeft = this.startLeft;
            let newTop = this.startTop;
            
            // Handle different resize directions
            if (handleClass.includes('resize-e') || handleClass.includes('resize-ne') || handleClass.includes('resize-se')) {
                newWidth = Math.max(200, this.startWidth + deltaX);
            }
            if (handleClass.includes('resize-w') || handleClass.includes('resize-nw') || handleClass.includes('resize-sw')) {
                newWidth = Math.max(200, this.startWidth - deltaX);
                newLeft = this.startLeft + deltaX;
            }
            if (handleClass.includes('resize-s') || handleClass.includes('resize-se') || handleClass.includes('resize-sw')) {
                newHeight = Math.max(150, this.startHeight + deltaY);
            }
            if (handleClass.includes('resize-n') || handleClass.includes('resize-nw') || handleClass.includes('resize-ne')) {
                newHeight = Math.max(150, this.startHeight - deltaY);
                newTop = this.startTop + deltaY;
            }
            
            this.panel.style.width = newWidth + 'px';
            this.panel.style.height = newHeight + 'px';
            this.panel.style.left = newLeft + 'px';
            this.panel.style.top = newTop + 'px';
            this.panel.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isResizing) {
                this.isResizing = false;
                this.resizeHandle = null;
                this.panel.classList.remove('resizing');
                document.body.style.userSelect = '';
                this.savePosition();
                
                // Hide handles after resize
                setTimeout(() => {
                    if (!this.panel.matches(':hover')) {
                        this.panel.querySelectorAll('.resize-handle').forEach(handle => {
                            handle.style.opacity = '0';
                        });
                    }
                }, 100);
            }
        });
    }
    
    savePosition() {
        if (localStorage.getItem("cookieConsent") === "accepted") {
            const rect = this.panel.getBoundingClientRect();
            const position = {
                left: parseInt(this.panel.style.left) || rect.left,
                top: parseInt(this.panel.style.top) || rect.top,
                width: parseInt(this.panel.style.width) || rect.width,
                height: parseInt(this.panel.style.height) || rect.height
            };
            localStorage.setItem('exercisePanelPosition', JSON.stringify(position));
        }
    }
    
    loadPosition() {
        if (localStorage.getItem("cookieConsent") === "accepted") {
            const saved = localStorage.getItem('exercisePanelPosition');
            if (saved) {
                const position = JSON.parse(saved);
                this.panel.style.left = position.left + 'px';
                this.panel.style.top = position.top + 'px';
                this.panel.style.width = position.width + 'px';
                this.panel.style.height = position.height + 'px';
                this.panel.style.transform = 'none';
            }
        }
    }
    
    resetPosition() {
        // Reset to default position and size
        this.panel.style.left = '20px';
        this.panel.style.top = '20px';
        this.panel.style.width = '280px';
        this.panel.style.height = '400px';
        this.panel.style.transform = 'none';
        this.savePosition();
        
        // Brief visual feedback
        this.panel.style.transition = 'all 0.3s ease';
        setTimeout(() => {
            this.panel.style.transition = '';
        }, 300);
    }
}

// Export the class for use in other modules
export { DragResizePanel };