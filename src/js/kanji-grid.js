// Get elements
const gridContainer = document.getElementById('gridContainer');

// Counter for new items
let itemCount = gridContainer.children.length + 1;

// Function to add new grid item
function addGridItem(text = null) {
    const newItem = document.createElement('div');
    newItem.className = 'grid-item';
    newItem.textContent = text || `Item ${itemCount}`;
    
    // Add click handler (optional)
    newItem.addEventListener('click', function() {
        console.log(`Clicked: ${this.textContent}`);
    });
    
    gridContainer.appendChild(newItem);
    itemCount++;
}

// Example: Add item with custom text
// addGridItem('Custom Item');