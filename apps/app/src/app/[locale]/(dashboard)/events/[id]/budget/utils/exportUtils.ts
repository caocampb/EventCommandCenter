import type { BudgetItem } from '@/types/budget';

interface BudgetTotals {
  plannedTotal: number;
  actualTotal: number;
  categoryTotals: {category: string, plannedAmount: number, actualAmount: number}[];
}

// Export budget as CSV
export function exportAsCSV(
  items: BudgetItem[], 
  totals: BudgetTotals, 
  eventName: string, 
  getVendorName: (vendorId?: string) => string
) {
  // Prepare the data
  const csvRows = [
    // Header row
    ['Description', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
    
    // Data rows - use current filtered items
    ...items.map(item => [
      item.description,
      item.category,
      getVendorName(item.vendorId),
      // Format numbers without quotes for better spreadsheet imports
      item.plannedAmount,
      item.actualAmount || '',
      item.isPaid ? 'Paid' : 'Unpaid'
    ]),
    
    // Empty row before totals
    [],
    
    // Totals - Format better for import
    ['TOTAL', '', '', totals.plannedTotal, totals.actualTotal, '']
  ];
  
  // Convert to CSV content with better number handling
  const csvContent = csvRows
    .map(row => {
      return row.map(cell => {
        // Don't quote numbers for better spreadsheet imports
        if (typeof cell === 'number') return cell;
        // Quote strings properly, escaping any quotes within
        if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
        // Handle empty values
        return cell === null || cell === undefined ? '' : `"${cell}"`;
      }).join(',');
    })
    .join('\n');
  
  // Create and trigger download
  downloadFile(csvContent, 'csv', eventName, 'budget');
}

// Export for Google Sheets with formulas
export function exportForGoogleSheets(
  items: BudgetItem[], 
  totals: BudgetTotals, 
  eventName: string, 
  getVendorName: (vendorId?: string) => string
) {
  // Almost identical to CSV export but with Google Sheets optimizations
  const csvRows = [
    // Header row
    ['Description', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
    
    // Data rows
    ...items.map(item => [
      item.description,
      item.category,
      getVendorName(item.vendorId),
      // Format numbers without quotes for better spreadsheet imports
      item.plannedAmount,
      item.actualAmount || '',
      item.isPaid ? 'Paid' : 'Unpaid'
    ]),
    
    // Empty row before totals
    [],
    
    // Add formulas for Google Sheets
    ['TOTAL', '', '', '=SUM(D2:D' + (items.length + 1) + ')', '=SUM(E2:E' + (items.length + 1) + ')', '']
  ];
  
  // Convert to CSV content with Google Sheets optimizations
  const csvContent = csvRows
    .map(row => {
      return row.map(cell => {
        if (typeof cell === 'number') return cell;
        if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
        return cell === null || cell === undefined ? '' : `"${cell}"`;
      }).join(',');
    })
    .join('\n');
  
  downloadFile(csvContent, 'csv', eventName, 'budget-sheets');
}

// Export for Airtable with optimal formatting
export function exportForAirtable(
  items: BudgetItem[], 
  eventName: string, 
  getVendorName: (vendorId?: string) => string
) {
  // Airtable prefers a flat structure without totals
  const csvRows = [
    // Header row - using Airtable-friendly names
    ['Name', 'Category', 'Vendor', 'Planned Amount', 'Actual Amount', 'Status'],
    
    // Data rows only - Airtable will calculate its own totals
    ...items.map(item => [
      item.description,
      item.category,
      getVendorName(item.vendorId),
      // Format numbers without quotes for better imports
      item.plannedAmount,
      item.actualAmount || '',
      item.isPaid ? 'Paid' : 'Unpaid'
    ])
  ];
  
  // Convert to CSV content
  const csvContent = csvRows
    .map(row => {
      return row.map(cell => {
        if (typeof cell === 'number') return cell;
        if (typeof cell === 'string') return `"${cell.replace(/"/g, '""')}"`;
        return cell === null || cell === undefined ? '' : `"${cell}"`;
      }).join(',');
    })
    .join('\n');
  
  downloadFile(csvContent, 'csv', eventName, 'budget-airtable');
}

// Generic file download helper function
function downloadFile(content: string, fileType: string, eventName: string, suffix: string) {
  const blob = new Blob([content], { type: `text/${fileType};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  // Create a clean filename
  const cleanEventName = eventName.toLowerCase().replace(/\s+/g, '-');
  const date = new Date().toISOString().split('T')[0];
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${cleanEventName}-${suffix}-${date}.${fileType}`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Create a print-friendly view with budget data
export function createPrintView(
  items: BudgetItem[], 
  totals: BudgetTotals, 
  eventName: string, 
  getVendorName: (vendorId?: string) => string
) {
  // Create a new window for the print view
  const printWindow = window.open('', '_blank');
  if (!printWindow) return; // Exit if popup blocked
  
  // Format numbers with commas and currency symbol
  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };
  
  // Calculate budget metrics
  const remainingBudget = totals.plannedTotal - totals.actualTotal;
  const isOverBudget = remainingBudget < 0;
  const percentUsed = totals.plannedTotal === 0 ? 0 : 
    Math.min(Math.round((totals.actualTotal / totals.plannedTotal) * 100), 999);
  
  // Generate HTML content with Linear-inspired design
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${eventName} Budget</title>
        <meta charset="UTF-8">
        <style>
          /* Linear-inspired typography and spacing */
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.5;
            color: #333;
            max-width: 1000px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          /* ... CSS styling omitted for brevity ... */
        </style>
      </head>
      <body>
        <div class="header-section">
          <h1>${eventName} Budget</h1>
          <p class="subtitle">Budget summary and detailed expenses</p>
          <p class="timestamp">Generated on ${new Date().toLocaleDateString('en-US', { 
            year: 'numeric', month: 'long', day: 'numeric' 
          })}</p>
        </div>
        
        <div class="summary-section">
          <div class="metric">
            <p class="metric-label">Total Budget</p>
            <p class="metric-value">${formatAmount(totals.plannedTotal)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Spent</p>
            <p class="metric-value">${formatAmount(totals.actualTotal)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Remaining</p>
            <p class="metric-value ${isOverBudget ? 'over-budget' : ''}">${formatAmount(remainingBudget)}</p>
          </div>
          <div class="metric">
            <p class="metric-label">Budget Used</p>
            <p class="metric-value ${isOverBudget ? 'over-budget' : ''}">${percentUsed}%</p>
          </div>
        </div>
        
        <!-- ... Rest of HTML template omitted for brevity ... -->
        
        <script>
          // Auto-open print dialog when the page loads
          window.onload = function() {
            // Small delay to ensure styles are applied
            setTimeout(() => { 
              window.print();
            }, 500);
          }
        </script>
      </body>
    </html>
  `);
  
  printWindow.document.close();
} 