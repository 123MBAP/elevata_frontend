const fs = require('fs');
const path = require('path');

const targetFile = 'd:\\MP\\AI\\Ltd\\Finovatra\\Elevata\\frontend\\src\\pages\\BusinessActivities.tsx';
let content = fs.readFileSync(targetFile, 'utf8');

// Find the start marker and end marker
const startMarker = '      {/* Header & Overview Card */}';
const endMarker = '      {/* ========================================================================= */}\r\n      {/* UNIFIED ACTIVITIES HISTORY LEDGER */}';
const endMarkerLF = '      {/* ========================================================================= */}\n      {/* UNIFIED ACTIVITIES HISTORY LEDGER */}';

let startIndex = content.indexOf(startMarker);
let endIndex = content.indexOf(endMarker);
if (endIndex === -1) {
  endIndex = content.indexOf(endMarkerLF);
}

if (startIndex === -1 || endIndex === -1) {
  console.error('Markers not found! start:', startIndex, 'end:', endIndex);
  process.exit(1);
}

const replacement = `      {/* ========================================================================= */}
      {/* 1. TOP ATTENTION NOTIFICATION BANNER (from screenshot) */}
      {/* ========================================================================= */}
      {showAttentionBanner && (
        <div className="flex items-center justify-between rounded-[4px] bg-[#ffa834] px-4 py-2 text-white shadow-xs">
          <div className="flex items-center gap-2 text-xs sm:text-[13px] font-semibold">
            <span className="font-bold">Attention!</span>
            <span>Click to allow displaying of desktop notifications.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAttentionBanner(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/20 hover:text-white transition-colors cursor-pointer"
              aria-label="Dismiss banner"
            >
              <X className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowLedgerView(!showLedgerView)}
              title="Toggle Ledger Journal"
              className="hidden sm:flex items-center justify-center h-7 w-7 rounded-[4px] bg-[#2998d6] hover:bg-[#1f85be] text-white transition-colors shadow-xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. MAIN ACCOUNTING BOOKS & JOURNAL ENTRY CARD */}
      {/* ========================================================================= */}
      <div className="accounting-card p-5 sm:p-7">
        {/* Card Header Title & Action Buttons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#e2e8f0]">
          <div>
            <h2 className="text-xl sm:text-2xl font-normal text-[#1e293b] font-heading">
              {activeTab === 'sales' && 'Add a new sale / customer invoice'}
              {activeTab === 'purchases' && 'Add a new purchase / stock intake'}
              {activeTab === 'cash_in' && 'Add a new cash inflow / capital receipt'}
              {activeTab === 'cash_out' && 'Add a new cash outflow / expense voucher'}
              {activeTab === 'other' && 'Add a new milestone / general activity'}
            </h2>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setShowLedgerView(!showLedgerView)}
              className="accounting-btn-primary"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{showLedgerView ? 'Hide Audit Ledger' : 'Edit Fields / View Ledger'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="accounting-btn-secondary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Master Product</span>
            </button>
          </div>
        </div>

        {/* Top 3 Solid Cyan Select Dropdowns (matching the 3 selects in screenshot) */}
        <div className="pt-4 pb-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-4">
            <div>
              <label className="accounting-label">Activity Journal</label>
              <select
                value={activeTab}
                onChange={(e) => handleSelectTab(e.target.value as ActivityTab)}
                className="accounting-select w-full"
              >
                <option value="sales">Sales (Client Orders &amp; Receipts)</option>
                <option value="purchases">Purchases (Supplier Intake &amp; COGS)</option>
                <option value="cash_in">Cash In (Capital &amp; Inflows)</option>
                <option value="cash_out">Cash Out &amp; Operational Expenses</option>
                <option value="other">General Activities &amp; Milestones</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Settlement Channel</label>
              <select
                value={
                  activeTab === 'sales'
                    ? salePaymentMethod
                    : activeTab === 'purchases'
                    ? purchasePaymentMethod
                    : activeTab === 'cash_in'
                    ? cashInPaymentMethod
                    : cashOutPaymentMethod
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (activeTab === 'sales') setSalePaymentMethod(val);
                  else if (activeTab === 'purchases') setPurchasePaymentMethod(val);
                  else if (activeTab === 'cash_in') setCashInPaymentMethod(val);
                  else setCashOutPaymentMethod(val);
                }}
                className="accounting-select w-full"
              >
                <option value="Cash">Cash (Immediate Settlement)</option>
                <option value="Mobile Money">Mobile Money (MTN / Airtel MoMo)</option>
                <option value="Bank Transfer">Bank Wire Transfer</option>
                <option value="Credit / Receivable">Trade Credit (Accounts Receivable)</option>
                <option value="Cheque">Bank Cheque</option>
              </select>
            </div>

            <div>
              <label className="accounting-label">Ledger Status</label>
              <select
                value="Cleared"
                className="accounting-select w-full"
                readOnly
              >
                <option value="Cleared">Cleared &amp; Confirmed</option>
                <option value="Pending">Pending Reconciliation</option>
                <option value="Hold">Audit Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* TAB 1: SALES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'sales' && (
          <form onSubmit={handleRecordSale} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Customer / Client Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={saleCustomer}
                    onChange={(e) => setSaleCustomer(e.target.value)}
                    placeholder="e.g. Akagera Canteen or Walk-in Buyer"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Customer Segment / Type</label>
                  <select className="accounting-select w-full">
                    <option value="retail">Direct Retail Buyer</option>
                    <option value="wholesale">Wholesale Distributor</option>
                    <option value="institution">Institutional / Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">Delivery Location / City</label>
                  <input
                    type="text"
                    placeholder="e.g. Kigali Central or Musanze"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Contact / Phone Number</label>
                  <input
                    type="text"
                    value={saleContact}
                    onChange={(e) => setSaleContact(e.target.value)}
                    placeholder="+250 788 000 000"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Transaction Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="Immediate / Net 15 Days"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Invoice / Receipt Reference</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-081"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Tax ID / TIN (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 100-294-882"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Sales Representative / Agent</label>
                  <input
                    type="text"
                    placeholder={activeSme.ownerName || 'Branch Manager'}
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table: Accounting Ledger Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="accounting-label font-bold text-slate-800">
                  Product Line Items &amp; Inventory Decrement <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddSaleItem}
                  className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line Item</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[220px]">Product / Item from Master Catalog</th>
                      <th className="py-2 px-3 w-28">Unit</th>
                      <th className="py-2 px-3 w-36">Unit Price (FRW)</th>
                      <th className="py-2 px-3 w-28 text-center">Quantity</th>
                      <th className="py-2 px-3 w-36 text-right">Line Total (FRW)</th>
                      <th className="py-2 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {saleItems.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <div className="space-y-1">
                            <select
                              value={row.productId}
                              onChange={(e) => handleSaleItemChange(row.id, 'productId', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="">-- Select Master Product or Type Custom --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stockQuantity} {p.unit} in stock - {formatRWF(p.unitPrice)})
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.product}
                                onChange={(e) => handleSaleItemChange(row.id, 'product', e.target.value)}
                                placeholder="Or type custom item name..."
                                className="accounting-input w-full !h-7 !min-h-7 text-xs"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.unit || 'pcs'}
                            onChange={(e) => handleSaleItemChange(row.id, 'unit', e.target.value)}
                            className="accounting-select w-full !h-8 !min-h-8 text-xs font-mono"
                          >
                            {UNIT_SELECT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                            {row.unit && !UNIT_SELECT_OPTIONS.some((u) => u.value === row.unit) && (
                              <option value={row.unit}>{row.unit}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={row.price || ''}
                            onChange={(e) => handleSaleItemChange(row.id, 'price', Number(e.target.value))}
                            placeholder="0"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity || ''}
                            onChange={(e) => handleSaleItemChange(row.id, 'quantity', Number(e.target.value))}
                            placeholder="1"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRWF(Number(row.price || 0) * Number(row.quantity || 0))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteSaleRow(row.id)}
                            disabled={saleItems.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description / Ledger Memo Field */}
            <div>
              <label className="accounting-label">Description / Transaction Memo</label>
              <textarea
                rows={2}
                placeholder="Add audit notes, payment terms, or delivery voucher details..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Total & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Sale Settlement:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">{formatRWF(saleTotal)}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="submit"
                  disabled={isSubmittingSale}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingSale ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSaleCustomer('');
                    setSaleContact('');
                    setSaleItems([{ id: '1', productId: '', product: '', unit: 'pcs', price: 0, quantity: 1, availableStock: 0 }]);
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 2: PURCHASES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'purchases' && (
          <form onSubmit={handleRecordPurchase} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Supplier / Vendor Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={purchaseSupplier}
                    onChange={(e) => setPurchaseSupplier(e.target.value)}
                    placeholder="e.g. Bakhresa Grain Millers Ltd"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Inventory Warehouse / Hub</label>
                  <select className="accounting-select w-full">
                    <option value="main">Main Enterprise Warehouse</option>
                    <option value="transit">Goods in Transit</option>
                    <option value="store">Retail Storefront</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">Payment Terms</label>
                  <input
                    type="text"
                    placeholder="Immediate Cash / 30 Days Payable"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Supplier Invoice / PO Reference</label>
                  <input
                    type="text"
                    value={purchaseInvoiceRef}
                    onChange={(e) => setPurchaseInvoiceRef(e.target.value)}
                    placeholder="e.g. INV-2026-904"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Purchase Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Currency / Unit</label>
                  <input
                    type="text"
                    value="FRW (Rwandan Franc)"
                    readOnly
                    className="accounting-input w-full bg-slate-50"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Supplier TIN / Tax Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 102-394-118"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Supplier Contact Number</label>
                  <input
                    type="text"
                    placeholder="+250 788 000 000"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Received By / Inspector</label>
                  <input
                    type="text"
                    placeholder={activeSme.ownerName || 'Procurement Officer'}
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table: Accounting Ledger Grid */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="accounting-label font-bold text-slate-800">
                  Purchased Goods &amp; Stock Intake Lines <span className="text-rose-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleAddPurchaseItem}
                  className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Purchase Line</span>
                </button>
              </div>

              <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                      <th className="py-2 px-3 w-10 text-center">#</th>
                      <th className="py-2 px-3 min-w-[220px]">Item Description / Catalog Product</th>
                      <th className="py-2 px-3 w-28">Unit</th>
                      <th className="py-2 px-3 w-36">Unit Cost Price (FRW)</th>
                      <th className="py-2 px-3 w-28 text-center">Quantity</th>
                      <th className="py-2 px-3 w-36 text-right">Line Total (FRW)</th>
                      <th className="py-2 px-3 w-14 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e2e8f0] bg-white">
                    {purchaseItems.map((row, idx) => (
                      <tr key={row.id} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                        <td className="py-2 px-2">
                          <div className="space-y-1">
                            <select
                              value={row.productId}
                              onChange={(e) => handlePurchaseItemChange(row.id, 'productId', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="">-- Match Catalog Product or Enter Custom --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.stockQuantity} {p.unit} in stock)
                                </option>
                              ))}
                            </select>
                            {!row.productId && (
                              <input
                                type="text"
                                value={row.name}
                                onChange={(e) => handlePurchaseItemChange(row.id, 'name', e.target.value)}
                                placeholder="Type item description..."
                                className="accounting-input w-full !h-7 !min-h-7 text-xs"
                              />
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-2">
                          <select
                            value={row.unit || 'pcs'}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'unit', e.target.value)}
                            className="accounting-select w-full !h-8 !min-h-8 text-xs font-mono"
                          >
                            {UNIT_SELECT_OPTIONS.map((u) => (
                              <option key={u.value} value={u.value}>
                                {u.label}
                              </option>
                            ))}
                            {row.unit && !UNIT_SELECT_OPTIONS.some((u) => u.value === row.unit) && (
                              <option value={row.unit}>{row.unit}</option>
                            )}
                          </select>
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            value={row.unitPrice || ''}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'unitPrice', Number(e.target.value))}
                            placeholder="0"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={row.quantity || ''}
                            onChange={(e) => handlePurchaseItemChange(row.id, 'quantity', Number(e.target.value))}
                            placeholder="1"
                            className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-center"
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">
                          {formatRWF(Number(row.unitPrice || 0) * Number(row.quantity || 0))}
                        </td>
                        <td className="py-2 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeletePurchaseRow(row.id)}
                            disabled={purchaseItems.length <= 1}
                            className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            title="Delete row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Description / Purchase Memo */}
            <div>
              <label className="accounting-label">Description / Intake Goods Memo</label>
              <textarea
                rows={2}
                placeholder="Log supplier delivery consignment number, warehouse shelf, or batch expiration date..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Total & Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Supplier Payable:</span>
                <span className="text-lg font-bold font-mono text-blue-700">{formatRWF(purchaseTotal)}</span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button
                  type="submit"
                  disabled={isSubmittingPurchase}
                  className="accounting-btn-primary"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSubmittingPurchase ? 'Saving...' : 'Save'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPurchaseSupplier('');
                    setPurchaseInvoiceRef('');
                    setPurchaseItems([{ id: '1', productId: '', name: '', unit: 'pcs', unitPrice: 0, quantity: 1 }]);
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 3: CASH IN FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'cash_in' && (
          <form onSubmit={handleRecordCashIn} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Source of Inflow / Fund Provider <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={cashInSource}
                    onChange={(e) => setCashInSource(e.target.value)}
                    placeholder="e.g. Bank of Kigali / Business Owner Capital"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">
                    Inflow Amount (FRW) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cashInAmount}
                    onChange={(e) => setCashInAmount(e.target.value)}
                    placeholder="e.g. 5000000"
                    required
                    className="accounting-input w-full font-mono"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Reason / Capital Category</label>
                  <select
                    value={cashInReason}
                    onChange={(e) => setCashInReason(e.target.value)}
                    className="accounting-select w-full"
                  >
                    <option value="Loan received">Commercial Bank Loan Received</option>
                    <option value="Owner capital injection">Owner Equity / Capital Injection</option>
                    <option value="Grant received">Donor / Government Grant Award</option>
                    <option value="Customer advance">Customer Advance / Retainer</option>
                    <option value="Receivable collected">Accounts Receivable Settlement</option>
                    <option value="Asset disposal">Disposal of Fixed Assets</option>
                    <option value="Other inflow">Other Direct Cash Inflow</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">
                    Transaction Date <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={cashInDate}
                    onChange={(e) => setCashInDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Bank Reference / Deposit Slip</label>
                  <input
                    type="text"
                    value={cashInNotes}
                    onChange={(e) => setCashInNotes(e.target.value)}
                    placeholder="e.g. TXN-8942-019"
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Receiving Account / Drawer</label>
                  <input
                    type="text"
                    placeholder="BK Corporate / Main Cash Box"
                    className="accounting-input w-full"
                  />
                </div>
              </div>
            </div>

            {/* Description / Ledger Memo */}
            <div>
              <label className="accounting-label">Description / Fund Allocation Notes</label>
              <textarea
                rows={2}
                value={cashInNotes}
                onChange={(e) => setCashInNotes(e.target.value)}
                placeholder="Specify credit tranche, interest rate, repayment terms, or equity agreement details..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Total Inflow Credit:</span>
                <span className="text-lg font-bold font-mono text-emerald-700">
                  {formatRWF(Number(cashInAmount) || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button type="submit" className="accounting-btn-primary">
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCashInAmount('');
                    setCashInSource('');
                    setCashInNotes('');
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ===================================================================== */}
        {/* TAB 4: CASH OUT & EXPENSES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'cash_out' && (
          <div className="space-y-4">
            {/* Mode Switcher */}
            <div className="flex items-center gap-2 pb-2">
              <button
                type="button"
                onClick={() => setCashOutMode('single')}
                className={`text-xs font-semibold px-3 py-1 rounded-[4px] transition-colors cursor-pointer ${
                  cashOutMode === 'single'
                    ? 'bg-[#2998d6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Single Disbursement
              </button>
              <button
                type="button"
                onClick={() => setCashOutMode('batch')}
                className={`text-xs font-semibold px-3 py-1 rounded-[4px] transition-colors cursor-pointer ${
                  cashOutMode === 'batch'
                    ? 'bg-[#2998d6] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Batch Multi-Invoice
              </button>
            </div>

            {cashOutMode === 'single' ? (
              <form onSubmit={handleRecordSingleCashOut} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
                  {/* Column 1 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">
                        Recipient / Expense Description <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="text"
                        value={cashOutDescription}
                        onChange={(e) => setCashOutDescription(e.target.value)}
                        placeholder="e.g. Office Electricity Bill or BK Loan"
                        required
                        className="accounting-input w-full"
                      />
                    </div>
                    <div>
                      <label className="accounting-label">
                        Amount (FRW) <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={cashOutAmount}
                        onChange={(e) => setCashOutAmount(e.target.value)}
                        placeholder="e.g. 350000"
                        required
                        className="accounting-input w-full font-mono"
                      />
                    </div>
                  </div>

                  {/* Column 2 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">
                        Expense Category <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={cashOutCategory}
                        onChange={(e) => setCashOutCategory(e.target.value)}
                        className="accounting-select w-full"
                      >
                        <optgroup label="Operational Expenses">
                          <option value="Utilities">Utilities (Water, Power, Internet)</option>
                          <option value="Rent">Rent &amp; Facility Leases</option>
                          <option value="Salaries">Staff Payroll &amp; Direct Wages</option>
                          <option value="Repairs">Machinery Repairs &amp; Maintenance</option>
                          <option value="Transport">Transport, Fuel &amp; Haulage</option>
                          <option value="Marketing">Marketing, Ads &amp; Promotions</option>
                          <option value="Taxes">Taxes, Municipal Levies &amp; RRA</option>
                          <option value="General Expenses">General Office Operations</option>
                        </optgroup>
                        <optgroup label="Financial Outflows">
                          <option value="Loan Repayment">Bank Loan / Credit Repayment</option>
                          <option value="Supplier Settlement">Accounts Payable / Supplier Settlement</option>
                          <option value="Owner Drawing">Owner Drawing / Dividend Cashout</option>
                          <option value="Asset Purchase">Machinery / Fixed Asset Purchase</option>
                        </optgroup>
                      </select>
                    </div>
                    <div>
                      <label className="accounting-label">
                        Payment Date <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="date"
                        value={cashOutDate}
                        onChange={(e) => setCashOutDate(e.target.value)}
                        required
                        className="accounting-input w-full"
                      />
                    </div>
                  </div>

                  {/* Column 3 */}
                  <div className="space-y-3">
                    <div>
                      <label className="accounting-label">Voucher / Receipt Reference</label>
                      <input
                        type="text"
                        value={cashOutNotes}
                        onChange={(e) => setCashOutNotes(e.target.value)}
                        placeholder="e.g. Receipt #84092"
                        className="accounting-input w-full"
                      />
                    </div>
                    <div>
                      <label className="accounting-label">Approval Authority</label>
                      <input
                        type="text"
                        placeholder={activeSme.ownerName || 'Finance Manager'}
                        className="accounting-input w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Description / Ledger Memo */}
                <div>
                  <label className="accounting-label">Description / Accounting Justification</label>
                  <textarea
                    rows={2}
                    value={cashOutNotes}
                    onChange={(e) => setCashOutNotes(e.target.value)}
                    placeholder="Log disbursement details, department charge code, or invoice approval notes..."
                    className="accounting-textarea w-full"
                  />
                </div>

                {/* Bottom Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 uppercase font-semibold">Total Debit Outflow:</span>
                    <span className="text-lg font-bold font-mono text-rose-700">
                      {formatRWF(Number(cashOutAmount) || 0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button type="submit" className="accounting-btn-primary">
                      <Check className="w-4 h-4" />
                      <span>Save</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCashOutAmount('');
                        setCashOutDescription('');
                        setCashOutNotes('');
                      }}
                      className="accounting-btn-secondary"
                    >
                      <X className="w-4 h-4" />
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* Batch Invoices Mode */
              <form onSubmit={handleRecordBatchCashOut} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="accounting-label">
                      Batch Effective Date <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="date"
                      value={cashOutDate}
                      onChange={(e) => setCashOutDate(e.target.value)}
                      required
                      className="accounting-input w-full"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto border border-[#cbd5e1] rounded-[4px] bg-white">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#f1f5f9] text-[#475569] font-bold border-b border-[#cbd5e1] text-[11px] uppercase tracking-wider">
                        <th className="py-2 px-3 w-10 text-center">#</th>
                        <th className="py-2 px-3 min-w-[200px]">Expense Description</th>
                        <th className="py-2 px-3 w-56">Category</th>
                        <th className="py-2 px-3 w-40">Payment Channel</th>
                        <th className="py-2 px-3 w-40 text-right">Amount (FRW)</th>
                        <th className="py-2 px-3 w-14 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e2e8f0] bg-white">
                      {cashOutBatchLines.map((row, idx) => (
                        <tr key={row.id} className="hover:bg-slate-50/70">
                          <td className="py-2 px-3 text-center font-mono text-slate-400 font-bold">{idx + 1}</td>
                          <td className="py-2 px-2">
                            <input
                              type="text"
                              value={row.description}
                              onChange={(e) => handleBatchLineChange(row.id, 'description', e.target.value)}
                              placeholder="e.g. Office supplies or Internet"
                              className="accounting-input w-full !h-8 !min-h-8 text-xs"
                            />
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={row.category}
                              onChange={(e) => handleBatchLineChange(row.id, 'category', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="Utilities">Utilities</option>
                              <option value="Rent">Rent</option>
                              <option value="Salaries">Salaries</option>
                              <option value="Repairs">Repairs</option>
                              <option value="Transport">Transport</option>
                              <option value="Marketing">Marketing</option>
                              <option value="General Expenses">General Expenses</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <select
                              value={row.paymentMethod}
                              onChange={(e) => handleBatchLineChange(row.id, 'paymentMethod', e.target.value)}
                              className="accounting-select w-full !h-8 !min-h-8 text-xs"
                            >
                              <option value="Cash">Cash</option>
                              <option value="Mobile Money">MoMo</option>
                              <option value="Bank Transfer">Bank Wire</option>
                            </select>
                          </td>
                          <td className="py-2 px-2">
                            <input
                              type="number"
                              value={row.amount || ''}
                              onChange={(e) => handleBatchLineChange(row.id, 'amount', Number(e.target.value))}
                              placeholder="0"
                              className="accounting-input w-full !h-8 !min-h-8 text-xs font-mono text-right"
                            />
                          </td>
                          <td className="py-2 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteBatchLine(row.id)}
                              disabled={cashOutBatchLines.length <= 1}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 rounded transition cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={handleAddBatchLine}
                    className="text-xs font-semibold text-[#0284c7] hover:text-[#0369a1] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Expense Line</span>
                  </button>
                  <div className="text-right">
                    <span className="text-xs text-slate-500 font-semibold mr-2">Batch Total:</span>
                    <span className="font-mono font-bold text-rose-700">{formatRWF(batchTotal)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#e2e8f0]">
                  <button type="submit" className="accounting-btn-primary">
                    <Check className="w-4 h-4" />
                    <span>Save Batch</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCashOutMode('single')}
                    className="accounting-btn-secondary"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ===================================================================== */}
        {/* TAB 5: OTHER ACTIVITIES FORM (3-Column Accounting Grid) */}
        {/* ===================================================================== */}
        {activeTab === 'other' && (
          <form onSubmit={handleRecordOther} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
              {/* Column 1 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">
                    Activity Title / Contract Name <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherTitle}
                    onChange={(e) => setOtherTitle(e.target.value)}
                    placeholder="e.g. RDB Business Registration"
                    required
                    className="accounting-input w-full"
                  />
                </div>
                <div>
                  <label className="accounting-label">Milestone Classification</label>
                  <input
                    type="text"
                    value={otherCategory}
                    onChange={(e) => setOtherCategory(e.target.value)}
                    placeholder="e.g. Regulatory Compliance / Asset Purchase"
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 2 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Execution Status</label>
                  <select
                    value={otherStatus}
                    onChange={(e) => setOtherStatus(e.target.value as any)}
                    className="accounting-select w-full"
                  >
                    <option value="Completed">Completed / Certified</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Planned">Planned</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
                <div>
                  <label className="accounting-label">
                    Date of Milestone <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="date"
                    value={otherDate}
                    onChange={(e) => setOtherDate(e.target.value)}
                    required
                    className="accounting-input w-full"
                  />
                </div>
              </div>

              {/* Column 3 */}
              <div className="space-y-3">
                <div>
                  <label className="accounting-label">Budget / Contract Value (FRW)</label>
                  <input
                    type="number"
                    value={otherAmount}
                    onChange={(e) => setOtherAmount(e.target.value)}
                    placeholder="e.g. 12000000"
                    className="accounting-input w-full font-mono"
                  />
                </div>
                <div>
                  <label className="accounting-label">Payment / Settlement Status</label>
                  <select
                    value={otherPaymentStatus}
                    onChange={(e) => setOtherPaymentStatus(e.target.value as any)}
                    className="accounting-select w-full"
                  >
                    <option value="Completed">Fully Paid / Cleared</option>
                    <option value="Pending">Pending Payment</option>
                    <option value="Partial">Partial Settlement</option>
                    <option value="N/A">Not Applicable</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Description / Ledger Memo */}
            <div>
              <label className="accounting-label">Description / Activity Deliverables</label>
              <textarea
                rows={2}
                value={otherDescription}
                onChange={(e) => setOtherDescription(e.target.value)}
                placeholder="Log contract milestones, terms of engagement, or compliance documentation..."
                className="accounting-textarea w-full"
              />
            </div>

            {/* Bottom Actions Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pt-4 border-t border-[#e2e8f0] gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 uppercase font-semibold">Contract Valuation:</span>
                <span className="text-lg font-bold font-mono text-purple-700">
                  {formatRWF(Number(otherAmount) || 0)}
                </span>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <button type="submit" className="accounting-btn-primary">
                  <Check className="w-4 h-4" />
                  <span>Save</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOtherTitle('');
                    setOtherDescription('');
                    setOtherAmount('');
                  }}
                  className="accounting-btn-secondary"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>
          </form>
        )}
      </div>

`;

const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
fs.writeFileSync(targetFile, newContent, 'utf8');
console.log('Successfully updated BusinessActivities.tsx with enterprise 3-column form layout!');
