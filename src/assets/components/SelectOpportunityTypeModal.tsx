import {
  X,
  ChevronRight,
  Landmark,
  Gift,
  Smartphone,
  TrendingUp,
  Layers,
  ShieldCheck
} from 'lucide-react';
import logo from '../images/elevata_logo.png';

export type OpportunityType = 'loan' | 'grant' | 'fintech' | 'equity' | 'agricultural_loan' | 'guarantee';

interface SelectOpportunityTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectType: (type: OpportunityType, category: string) => void;
}

export default function SelectOpportunityTypeModal({
  isOpen,
  onClose,
  onSelectType
}: SelectOpportunityTypeModalProps) {
  if (!isOpen) return null;

  const opportunityTypes = [
    {
      type: 'loan' as OpportunityType,
      category: 'Loan',
      title: 'Loan & Credit Facility',
      badge: 'Debt Financing',
      badgeColor: 'bg-[#0a66c2]/10 text-[#0a66c2] border-[#0a66c2]/20',
      icon: <Landmark className="w-5 h-5 text-[#0a66c2]" />,
      desc: 'Working capital, inventory financing, term loans, and credit lines with custom interest & grace periods.'
    },
    {
      type: 'grant' as OpportunityType,
      category: 'Grant',
      title: 'Grant & Non-Dilutive Subsidy',
      badge: '100% Equity Free',
      badgeColor: 'bg-[#057642]/10 text-[#057642] border-[#057642]/20',
      icon: <Gift className="w-5 h-5 text-[#057642]" />,
      desc: 'Donor-funded subsidies, development grants, matching capital, and innovation prize programs.'
    },
    {
      type: 'fintech' as OpportunityType,
      category: 'Fintech Product',
      title: 'Fintech & Digital Rails',
      badge: 'Merchant Solutions',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      icon: <Smartphone className="w-5 h-5 text-indigo-600" />,
      desc: 'POS terminals, merchant wallets, payment gateways, and automated revenue collection systems.'
    },
    {
      type: 'equity' as OpportunityType,
      category: 'Investment',
      title: 'Equity & Venture Capital',
      badge: 'Growth Capital',
      badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: <TrendingUp className="w-5 h-5 text-purple-600" />,
      desc: 'Direct equity investments, convertible debt notes, syndicate co-investments, and angel capital.'
    },
    {
      type: 'agricultural_loan' as OpportunityType,
      category: 'Loan',
      title: 'Agri & Value-Chain Facility',
      badge: 'Seasonal / Crop',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      icon: <Layers className="w-5 h-5 text-emerald-700" />,
      desc: 'Seasonal crop financing, warehouse receipt credit, input vouchers, and contract off-taker facilities.'
    },
    {
      type: 'guarantee' as OpportunityType,
      category: 'Guarantee',
      title: 'Credit Guarantee & Insurance',
      badge: 'Risk Mitigation',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      icon: <ShieldCheck className="w-5 h-5 text-amber-700" />,
      desc: 'Partial credit risk guarantees, trade insurance, collateral support, and export protection.'
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px] z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-[10px] bg-white border border-[#e0e0e0] shadow-[0_8px_30px_rgba(0,0,0,0.12)] overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-[#e0e0e0] bg-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Elevata" className="h-8 w-8 object-contain" />
            <div>
              <h3 className="text-base font-bold text-[#181818] font-heading">
                Select Opportunity Type
              </h3>
              <p className="text-[12px] text-[#5e5e5e] mt-0.5 font-sans">
                Choose the structure of financial product or program you want to publish
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#5e5e5e] hover:text-[#181818] hover:bg-[#f3f2f0] rounded-full transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content - 6 Type Selection Cards */}
        <div className="p-6 bg-[#f3f2f0]/40 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {opportunityTypes.map((item) => (
              <div
                key={item.type}
                onClick={() => onSelectType(item.type, item.category)}
                className="group p-4 rounded-[10px] border border-[#e0e0e0] hover:border-[#0a66c2] bg-white hover:bg-[#f3f2f0]/50 transition-all cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_16px_rgba(10,102,194,0.12)] flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="p-2.5 rounded-[8px] bg-[#f3f2f0] group-hover:bg-white border border-[#e0e0e0] transition-colors">
                      {item.icon}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#181818] group-hover:text-[#0a66c2] transition-colors font-heading">
                      {item.title}
                    </h4>
                    <p className="text-[12px] text-[#5e5e5e] mt-1 leading-relaxed font-sans line-clamp-2">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-[#f3f2f0] flex items-center justify-between text-xs font-semibold text-[#0a66c2] group-hover:translate-x-0.5 transition-transform">
                  <span>Configure Form</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-[#e0e0e0] flex justify-end items-center">
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 items-center justify-center rounded-full border border-[#666666] bg-white px-5 text-[13px] font-semibold text-[#181818] transition-colors hover:bg-[#f3f2f0]"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
