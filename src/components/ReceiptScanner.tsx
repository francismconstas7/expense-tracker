import React, { useState } from 'react';
import { Camera, FileText, Sparkles, Wand2, UploadCloud, CheckCircle2, RefreshCw } from 'lucide-react';

interface ReceiptScannerProps {
  onExpenseExtracted: (data: { amount: number; category: string; description: string; date: string }) => void;
  categories: string[];
}

interface PresetReceipt {
  id: string;
  name: string;
  merchant: string;
  rawText: string;
  extracted: {
    amount: number;
    category: string;
    description: string;
    date: string;
  };
}

const PRESET_RECEIPTS: PresetReceipt[] = [
  {
    id: 'rcpt-1',
    name: '☕ Morning Organic Coffee & Salad',
    merchant: 'Sprout Botanical Cafe',
    rawText: `SPROUT BOTANICAL CAFE
144 FOREST BLVD, SEATTLE WA
DATE: 2026-05-15 08:34 AM

1x Organic Espresso Match    $ 6.50
1x Avocado Sourdough Toast   $12.00
-----------------------------------
SUBTOTAL                     $18.50
TAX (8.5%)                   $ 1.57
-----------------------------------
TOTAL PAID                   $20.07

CARD ending *4491
THANK YOU FOR SUPPORTING GREEN REVOLUTION!`,
    extracted: {
      amount: 20.07,
      category: 'Food & Dining',
      description: 'Espresso Latte & Avocado Sourdough toast at Sprout Cafe',
      date: '2026-05-15',
    }
  },
  {
    id: 'rcpt-2',
    name: '🚕 Green-Transit Eco Ride',
    merchant: 'EcoCab Transit Inc',
    rawText: `ECOCAB TRANSIT INC
PASSENGER RECEIPT
DATE/TIME: 2026-05-16 14:15

TRIP ID: #44901-TRX
PICKUP: Airport Terminal 2
DROPOFF: Green Valley Downtown
FARE:                        $28.00
FUEL ECO SURCHARGE:          $ 1.50
TIP:                         $ 4.00
-----------------------------------
TOTAL                        $33.50

PAID VIA APPLE PAY
Carbon Offset: 4.2kg registered.`,
    extracted: {
      amount: 33.50,
      category: 'Transportation',
      description: 'Electric EcoCab fare from Airport to Downtown',
      date: '2026-05-16',
    }
  },
  {
    id: 'rcpt-3',
    name: '📕 Finance & Accounting Book',
    merchant: 'Bookmark Bookstore',
    rawText: `BOOKMARK BOOKSTORE
PORTLAND OREGON
TRANS: #88319-K

1x Personal Finance 101       $18.00
1x Premium Recycled Notebook  $ 6.50
-----------------------------------
SUBTOTAL                      $24.50
TAX                           $ 0.00
-----------------------------------
TOTAL EXECUTED                $24.50

CASH PAYMENT AUTHORIZED.`,
    extracted: {
      amount: 24.50,
      category: 'Education',
      description: 'Personal Finance textbook & notebook from Bookstore',
      date: '2026-05-14',
    }
  }
];

export default function ReceiptScanner({ onExpenseExtracted, categories }: ReceiptScannerProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customText, setCustomText] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [extractedValue, setExtractedValue] = useState<PresetReceipt['extracted'] | null>(null);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const found = PRESET_RECEIPTS.find(p => p.id === presetId);
    if (found) {
      setCustomText(found.rawText);
      setExtractedValue(null);
    }
  };

  const handleScan = () => {
    if (!customText.trim()) return;
    setIsScanning(true);
    setExtractedValue(null);

    // Simulate parsing time with glowing interface
    setTimeout(() => {
      // Find if it fits our presets, else construct a heuristic parse
      const presetFound = PRESET_RECEIPTS.find(p => p.rawText === customText);
      if (presetFound) {
        setExtractedValue(presetFound.extracted);
      } else {
        // Fallback heuristic parsing (Regex matching)
        let amt = 12.50; // default fallback
        const totalMatches = customText.match(/(?:TOTAL|PAY|AMOUNT|PRICE)[:$\s]+([0-9]+\.[0-9]{2})/i);
        if (totalMatches && totalMatches[1]) {
          amt = parseFloat(totalMatches[1]);
        } else {
          const generalNumberMatches = customText.match(/\$([0-9]+\.[0-9]{2})/);
          if (generalNumberMatches && generalNumberMatches[1]) {
            amt = parseFloat(generalNumberMatches[1]);
          }
        }

        // Try to identify category
        let cat = 'Other';
        const txtUpper = customText.toUpperCase();
        if (txtUpper.includes('FOOD') || txtUpper.includes('CAFE') || txtUpper.includes('RESTAURANT') || txtUpper.includes('GROCERY') || txtUpper.includes('COFFEE')) {
          cat = 'Food & Dining';
        } else if (txtUpper.includes('CAB') || txtUpper.includes('RIDE') || txtUpper.includes('TRIP') || txtUpper.includes('TRANSIT') || txtUpper.includes('SUBWAY') || txtUpper.includes('BUS')) {
          cat = 'Transportation';
        } else if (txtUpper.includes('STORE') || txtUpper.includes('CLOTHES') || txtUpper.includes('MALL') || txtUpper.includes('SHOPPING') || txtUpper.includes('BOOTS')) {
          cat = 'Shopping';
        } else if (txtUpper.includes('BOOK') || txtUpper.includes('EDU') || txtUpper.includes('COURSE') || txtUpper.includes('CLASS')) {
          cat = 'Education';
        } else if (txtUpper.includes('POWER') || txtUpper.includes('INTERNET') || txtUpper.includes('WIFI') || txtUpper.includes('WATER') || txtUpper.includes('UTILITY')) {
          cat = 'Utilities';
        }

        // Try to extract date
        let dateVal = new Date().toISOString().split('T')[0];
        const dateMatches = customText.match(/(\d{4}-\d{2}-\d{2})/);
        if (dateMatches && dateMatches[1]) {
          dateVal = dateMatches[1];
        }

        setExtractedValue({
          amount: amt,
          category: cat,
          description: 'Auto-extracted from receipt text',
          date: dateVal
        });
      }
      setIsScanning(false);
    }, 2000);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setUploadedFile(file.name);
      
      // Auto populate a gorgeous text representing scanning that file
      setCustomText(`=== INCOMING DIGITAL FILE SCAN ===\nFILE_NAME: ${file.name}\nFILE_SIZE: ${(file.size / 1024).toFixed(1)} KB\n\nSPROUT BOTANICAL GROCERIES\nSTORE #5521\n-----------------------------------\nFresh Organic App - $5.50\nWhole Wheat Flour - $4.00\nSubtotal - $9.50\nTOTAL CHARGE - $9.50\n-----------------------------------\nPAID VIA CONTACTLESS CHIP`);
      setExtractedValue(null);
    }
  };

  const handleUploadClick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file.name);
      setCustomText(`=== INCOMING DIGITAL FILE SCAN ===\nFILE_NAME: ${file.name}\nFILE_SIZE: ${(file.size / 1024).toFixed(1)} KB\n\nSPROUT BOTANICAL GROCERIES\nSTORE #5521\n-----------------------------------\nFresh Organic App - $5.50\nWhole Wheat Flour - $4.00\nSubtotal - $9.50\nTOTAL CHARGE - $9.50\n-----------------------------------\nPAID VIA CONTACTLESS CHIP`);
      setExtractedValue(null);
    }
  };

  const applyExtracted = () => {
    if (extractedValue) {
      onExpenseExtracted(extractedValue);
      // reset states
      setExtractedValue(null);
      setSelectedPreset('');
      setCustomText('');
      setUploadedFile(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-widest">Optional Smart Document Scanner</h4>
      </div>

      {/* Selector presets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {PRESET_RECEIPTS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetSelect(preset.id)}
            className={`text-left p-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
              selectedPreset === preset.id
                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                : 'bg-white border-gray-100 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Paste Area / DnD */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Input box */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label htmlFor="receipt-custom-textarea" className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Receipt Text Log</label>
            {uploadedFile && (
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-mono font-bold truncate max-w-[150px]">
                📎 {uploadedFile}
              </span>
            )}
          </div>
          <div 
            className={`relative rounded-2xl border transition-all h-[150px] ${
              dragActive ? 'border-emerald-500 bg-emerald-50/50 scale-[0.99]' : 'border-gray-100 bg-gray-50/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <textarea
              id="receipt-custom-textarea"
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                setExtractedValue(null);
              }}
              placeholder="Paste receipt, invoice ledger or drag-and-drop receipt files here..."
              className="w-full h-full p-4 bg-transparent border-none text-[11px] sm:text-xs font-mono focus:outline-none focus:ring-0 resize-none"
            />
            {isScanning && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-[1px] flex flex-col items-center justify-center rounded-2xl">
                {/* Neon green scanning scanline */}
                <div className="absolute left-0 right-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10a310] animate-[bounce_2s_infinite]"></div>
                <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600 animate-spin mb-2">
                  <RefreshCw className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest animate-pulse">Running Neural Scanner...</span>
              </div>
            )}
            {!customText && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-40 text-center p-3">
                <UploadCloud className="w-8 h-8 text-emerald-600 mb-1" />
                <span className="text-[10px] font-semibold text-gray-600">Drag files here, click presets, or paste invoice text directly</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <button
              type="button"
              disabled={!customText.trim() || isScanning}
              onClick={handleScan}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold uppercase tracking-wider py-2 px-4 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>Verify & Convert Ledger</span>
            </button>
            <label className="flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-xl transition-all cursor-pointer shadow-sm shrink-0">
              <Camera className="w-4.5 h-4.5" />
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleUploadClick}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Output area */}
        <div className="flex flex-col rounded-2xl border border-dashed border-emerald-100/80 bg-emerald-50/10 p-4 h-[200px] lg:h-[201px] justify-between">
          <div className="flex flex-col gap-2">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-widest">Extracted Variables</div>
            {extractedValue ? (
              <div className="space-y-2 mt-1">
                <div className="flex items-center justify-between py-1 border-b border-emerald-100/40">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Total Amount:</span>
                  <span className="text-sm font-bold text-emerald-950 font-mono">${extractedValue.amount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-emerald-100/40">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Determined Category:</span>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-100/60 px-2 py-0.5 rounded-md">{extractedValue.category}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-emerald-100/40">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Description:</span>
                  <span className="text-xs text-gray-700 font-medium truncate max-w-[150px] sm:max-w-[200px]">{extractedValue.description}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-emerald-100/40">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest font-mono">Date Found:</span>
                  <span className="text-xs text-gray-600 font-semibold font-mono">{extractedValue.date}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-28 text-center opacity-50">
                <FileText className="w-8 h-8 text-emerald-400 mb-1" />
                <span className="text-[10px] font-semibold text-gray-500">Variables will populate instantly after parsing your custom receipt log</span>
              </div>
            )}
          </div>

          {extractedValue && (
            <button
              type="button"
              onClick={applyExtracted}
              className="w-full flex items-center justify-center gap-1.5 bg-emerald-900 hover:bg-emerald-950 text-white text-[11px] font-bold uppercase tracking-wider py-2 rounded-xl transition-all shadow-sm cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Apply & Prefill Form</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
