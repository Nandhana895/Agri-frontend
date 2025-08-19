import React from 'react';

const Reports = () => {
  const generatePdf = () => {
    const html = `
      <html>
        <head>
          <title>AgriSense Report</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; }
            h1 { color: #2e7d32; }
            .muted { color: #555; }
          </style>
        </head>
        <body>
          <h1>AgriSense - Farm Summary</h1>
          <p class="muted">This is a mock report. Use the browser's Save as PDF option.</p>
          <h3>Farmer: John Doe</h3>
          <ul>
            <li>Soil pH: 6.5 (Optimal)</li>
            <li>Recommended Crops: Wheat, Maize, Soybean</li>
            <li>Fertilizer Plan: NPK 10-10-10 at 50kg/acre</li>
          </ul>
        </body>
      </html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.focus();
    w.print();
  };

  return (
    <div className="ag-card p-6">
      <h3 className="text-lg font-semibold text-gray-900">Reports</h3>
      <p className="text-gray-600 mt-2">Generate a mock PDF summary of your farm status.</p>
      <button onClick={generatePdf} className="mt-4 px-4 py-2 bg-[var(--ag-primary-500)] text-white rounded-lg hover:bg-[var(--ag-primary-600)]">Download PDF</button>
    </div>
  );
};

export default Reports;


