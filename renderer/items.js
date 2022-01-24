// Modules
const { shell } = require('electron');
const fs = require('fs');

// DOM nodes
let items = document.getElementById('items');

// Get readerJS content
let readerJS
fs.readFile(`${__dirname}/reader.js`, (err, data) => {
  readerJS = data.toString()
})

// Track items in storage
exports.storage =
  JSON.parse(localStorage.getItem('readit-items')) || [];

// Listen for "done" message from reader window
window.addEventListener('message', e => {
  // Check for correct message
  if (e.data.action === 'delete-reader-item') {
    // Delete an item at certain index
    this.delete(e.data.itemIndex);
    // Close the reader window
    e.source.close();
  }
  
});
// Delete item
exports.delete = itemIndex => {
  // Remove item from DOM
  items.removeChild(items.childNodes[itemIndex]);
  // Remove items from storage
  this.storage.splice(itemIndex, 1);
  // Persist storage
  this.save();
  // Select previous item or new top item
  if (this.storage.length) {
    // Get new selected item index
    let newSelectedItemIndex = (itemIndex === 0) ? 0 : itemIndex -1;
    document.getElementsByClassName('read-item')[newSelectedItemIndex].classList.add('selected')
  }
}

// Get selected item index
exports.getSelectedItem = () => {
  let currentItem = document.getElementsByClassName('read-item selected')[0];
  // Get item index node
  let itemIndex = 0;
  let child = currentItem;
  while((child = child.previousElementSibling) != null) itemIndex++

  // Return selected item and index
  return {node: currentItem, index: itemIndex}
}

// Persist storage
exports.save = () => {
  localStorage.setItem(
    'readit-items',
    JSON.stringify(this.storage)
  );
};
// Set item as selected
exports.select = (e) => {
  // Remove currently selected item class
this.getSelectedItem().node.classList.remove('selected');
  // Add to clicked item
  e.currentTarget.classList.add('selected');
};

// Moved to newly selected item
exports.changeSelection = (direction) => {
  // Get selected item
  let currentItem = this.getSelectedItem();
  if (
    direction === 'ArrowUp' &&
    currentItem.node.previousElementSibling
  ) {
    currentItem.node.classList.remove('selected');
    currentItem.node.previousElementSibling.classList.add(
      'selected'
    );
  } else if (
    direction === 'ArrowDown' &&
    currentItem.node.nextElementSibling
  ) {
    currentItem.node.classList.remove('selected');
    currentItem.node.nextElementSibling.classList.add(
      'selected'
    );
  }
};

// Open selected item in browser
exports.openNative = () => {
  // Only if we have items (in case of menu open)
  if (!this.storage.length) return;
  // Get selected item
  let selectedItem = this.getSelectedItem();
  // Get item's url
  let contentURL = selectedItem.node.dataset.url;
  // Open in the user's default browser
  shell.openExternal(contentURL);
}

// Open selected item
exports.open = () => {
  // Only if we have items (in case of menu open)
  if(!this.storage.length) return;
  // Get selected item
  let selectedItem = this.getSelectedItem();
    // Get item's url
    let contentURL = selectedItem.node.dataset.url;
    
    // Open item in proxy BrowserWindow
    let readerWin = window.open(contentURL, '', `
    maxWidth=2000,
    maxHeight=2000,
    width=1200,
    height=800,
    backgroundColor=#DEDEDE,
    nodeIntegration=0,
    contextIsolation=1
    `);

    // Inject Javascript with specific item index (selectedItem.index)
    readerWin.eval(readerJS.replace('{{index}}', selectedItem.index))
}

// Add new item
exports.addItem = (item, isNew = false) => {
  // Create a new DOM node
  let itemNode = document.createElement('div');

  // Assign "read-item" class
  itemNode.setAttribute('class', 'read-item');

  // Set item url as data attribute
  itemNode.setAttribute('data-url', item.url)

  // Add inner HTML
  itemNode.innerHTML = `<img src="${item.screenshot}"><h2>${item.title}</h2>`;
  // Append new node to "items" node
  items.appendChild(itemNode, true);

  // Attach new node to "items"
  itemNode.addEventListener('click', this.select);

  // Attach double click handler to open
  itemNode.addEventListener('dblclick', this.open);

  // If this is the first item, select it
  if (
    document.getElementsByClassName('read-item').length ===
    1
  ) {
    itemNode.classList.add('selected');
  }

  // Add item to storage and persist
  if (isNew) {
    this.storage.push(item);
    this.save();
  }
};

// Add item from storage when app loads
this.storage.forEach((item) => {
  this.addItem(item);
});
