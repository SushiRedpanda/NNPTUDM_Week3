// State to track if data is already fetched
let isDataFetched = false;
let allProducts = []; // Store all products for searching
let currentDisplayedProducts = []; // Store filtered/sorted products

// Sort state
let sortConfig = {
    key: null,
    order: 'asc'  // 'asc' or 'desc'
};
// Pagination state
let currentPage = 1;
let itemsPerPage = 10;

// TASK 1: Get all products from API
async function getAll() {
    // Prevent multiple fetches
    if (isDataFetched) {
        console.log('Data already fetched');
        return;
    }
    
    isDataFetched = true;
    console.log('Fetching products from API...');
    
    try {
        const response = await fetch('https://api.escuelajs.co/api/v1/products');
        
        if (!response.ok) {
            throw new Error('Failed to fetch products');
        }

        const products = await response.json();
        allProducts = products; // Store all products
        currentDisplayedProducts = products;
        console.log('Success! Loaded ' + products.length + ' products');
        
        renderTable(currentDisplayedProducts);
        
    } catch (error) {
        console.error('Error:', error);
        displayError('Error loading products: ' + error.message);
        isDataFetched = false; // Reset so it can retry
    }
}

// TASK 2: Search by title - onChange and onInput event
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    console.log('Search term:', searchTerm);
    
    // Filter products by title
    let filtered = allProducts;
    if (searchTerm) {
        filtered = allProducts.filter(product => {
            return product.title.toLowerCase().includes(searchTerm);
        });
    }
    
    console.log('Found ' + filtered.length + ' matching products');
    
    // Reset sort when searching
    sortConfig = { key: null, order: 'asc' };
    
    currentDisplayedProducts = filtered;
    currentPage = 1; // reset page
    renderTable(currentDisplayedProducts);
    renderPagination();
}

// TASK 3: Sort by column (title or price)
function handleSort(key) {
    console.log('Sort clicked - Column:', key);
    
    // Toggle sort order if clicking same column
    if (sortConfig.key === key) {
        sortConfig.order = sortConfig.order === 'asc' ? 'desc' : 'asc';
    } else {
        sortConfig.key = key;
        sortConfig.order = 'asc';
    }
    
    console.log('Sorting by ' + key + ' - ' + sortConfig.order);
    
    // Apply sort
    applySorting();
    currentPage = 1;
    renderTable(currentDisplayedProducts);
    renderPagination();
}

// Apply sorting logic
function applySorting() {
    if (!sortConfig.key) return;
    
    currentDisplayedProducts.sort((a, b) => {
        let valueA = a[sortConfig.key];
        let valueB = b[sortConfig.key];
        
        // Convert to string for comparison if needed
        if (typeof valueA === 'string') {
            valueA = valueA.toLowerCase();
            valueB = valueB.toLowerCase();
        }
        
        // Compare values
        let comparison = 0;
        if (valueA > valueB) {
            comparison = 1;
        } else if (valueA < valueB) {
            comparison = -1;
        }
        
        // Apply sort direction
        return sortConfig.order === 'asc' ? comparison : -comparison;
    });
}

// Render products in table
function renderTable(products) {
    const tbody = document.getElementById('productTableBody');
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 30px;">No products found</td></tr>';
        return;
    }

    // determine slice for current page
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageItems = products.slice(startIndex, endIndex);

    tbody.innerHTML = pageItems.map(product => {
        const categoryName = product.category?.name || 'N/A';
        // Use images array if image is not available
        const imageUrl = product.image || (product.images && product.images[0]) || '';
        
        // prepare description tooltip text (escape simple HTML)
        const desc = (product.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

        return `
            <tr>
                <td>${imageUrl ? `<img src="${imageUrl}" alt="${product.title}" class="product-image" style="width: 120px; height: 120px; object-fit: cover; display: block;" referrerpolicy="no-referrer">` : '<div style="width: 120px; height: 120px; background-color: #e0e0e0; display: flex; align-items: center; justify-content: center; color: #999;">No Image</div>'}</td>
                <td>${product.id}</td>
                <td>${product.title}</td>
                <td>$${parseFloat(product.price).toFixed(2)}</td>
                <td>${categoryName}</td>
                <td>
                    <div class="description-cell">Hover
                        <div class="description-tooltip">${desc || 'No description'}</div>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

// Display error message
function displayError(message) {
    const tbody = document.getElementById('productTableBody');
    tbody.innerHTML = `<tr><td colspan="5" class="error">${message}</td></tr>`;
}

// TASK 4: Pagination handlers
function handleItemsPerPageChange() {
    const sel = document.getElementById('itemsPerPage');
    itemsPerPage = parseInt(sel.value) || 10;
    currentPage = 1;
    renderTable(currentDisplayedProducts);
    renderPagination();
}

function getTotalPages() {
    return Math.max(1, Math.ceil(currentDisplayedProducts.length / itemsPerPage));
}

function renderPagination() {
    const totalPages = getTotalPages();
    const pageNumbersContainer = document.getElementById('pageNumbers');
    const pageInfo = document.getElementById('pageInfo');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    // build simple page buttons (show up to 7)
    let html = '';
    const maxToShow = 7;
    let start = Math.max(1, currentPage - Math.floor(maxToShow / 2));
    let end = Math.min(totalPages, start + maxToShow - 1);
    if (end - start < maxToShow - 1) start = Math.max(1, end - maxToShow + 1);

    if (start > 1) html += `<button class="pagination-btn" onclick="goToPage(1)">1</button>`;
    if (start > 2) html += `<span style="margin:0 6px;">...</span>`;

    for (let i = start; i <= end; i++) {
        const active = i === currentPage ? 'active' : '';
        html += `<button class="pagination-btn ${active}" onclick="goToPage(${i})">${i}</button>`;
    }

    if (end < totalPages - 1) html += `<span style="margin:0 6px;">...</span>`;
    if (end < totalPages) html += `<button class="pagination-btn" onclick="goToPage(${totalPages})">${totalPages}</button>`;

    pageNumbersContainer.innerHTML = html;
    pageInfo.textContent = `Page ${currentPage} / ${totalPages} (${Math.min((currentPage-1)*itemsPerPage+1, currentDisplayedProducts.length)}-${Math.min(currentPage*itemsPerPage, currentDisplayedProducts.length)} of ${currentDisplayedProducts.length})`;

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
}

function previousPage() {
    if (currentPage > 1) {
        currentPage--;
        renderTable(currentDisplayedProducts);
        renderPagination();
    }
}

function nextPage() {
    const totalPages = getTotalPages();
    if (currentPage < totalPages) {
        currentPage++;
        renderTable(currentDisplayedProducts);
        renderPagination();
    }
}

function goToPage(n) {
    const totalPages = getTotalPages();
    if (n < 1) n = 1;
    if (n > totalPages) n = totalPages;
    currentPage = n;
    renderTable(currentDisplayedProducts);
    renderPagination();
}

// Initialize on page load - ONLY ONCE
document.addEventListener('DOMContentLoaded', function() {
    console.log('Page loaded - calling getAll()');
    getAll();
});


