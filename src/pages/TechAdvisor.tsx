import { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { formatRWF } from '../lib/mockData';
import {
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  Cpu,
  Truck,
  ShoppingCart
} from 'lucide-react';
import { Card, CardContent } from '../assets/components/ui/card';
import { Button } from '../assets/components/ui/button';

interface TechRecommendation {
  id: number;
  name: string;
  description: string;
  impact: string;
  funding: string;
  costRange: string;
  minCost: number;
  maxCost: number;
  roiTimeframe: string;
  financingOptions: string[];
  marketTrend: string;
  implementationComplexity: 'Low' | 'Medium' | 'High';
  image: string;
  suppliers: {
    name: string;
    contact: string;
    website: string;
  }[];
  estimatedProfitIncrease: string;
  maintenanceCost: string;
  estimatedRoiPercentage: number;
}

export default function TechAdvisor() {
  const { activeSme } = useApp();
  const [selectedTech, setSelectedTech] = useState<TechRecommendation | null>(null);
  
  const [loanPercentage, setLoanPercentage] = useState(50);
  const [loanTerm, setLoanTerm] = useState(12);
  const [repaymentFrequency, setRepaymentFrequency] = useState<'weekly' | 'monthly' | 'quarterly'>('monthly');

  // Sector specific recommendations
  const sectorRecommendations = useMemo((): TechRecommendation[] => {
    switch (activeSme.sector) {
      case 'Retail':
        return [
          {
            id: 101,
            name: 'Cloud POS & Smart Inventory System',
            description: 'Automated point-of-sale integrated with real-time stock updates, cloud sync, and transaction registers.',
            impact: 'Cuts stockout events by 60% and increases transaction speed.',
            funding: 'Pre-approved commercial bank working capital.',
            costRange: '400,000 - 1,800,000 RWF',
            minCost: 400000,
            maxCost: 1800000,
            roiTimeframe: '3-6 months',
            financingOptions: ['Retail expansion credit', 'Vendor financing interest-free (6 months)'],
            marketTrend: 'Transition from manual cash box to digitized bookkeeping',
            implementationComplexity: 'Low',
            image: 'https://cff2.earth.com/uploads/2017/08/09184908/Online-food-shopping-found-to-make-healthy-decisions-easier.jpg',
            suppliers: [
              { name: 'Kigali POS Solutions', contact: '+250 788 123 456', website: 'kigalipos.rw' },
              { name: 'SmartStore East Africa', contact: '+250 783 987 654', website: 'smartstore.rw' }
            ],
            estimatedProfitIncrease: '18-25% annually',
            maintenanceCost: '45,000 RWF/year',
            estimatedRoiPercentage: 28
          },
          {
            id: 102,
            name: 'E-commerce & Mobile App Channel',
            description: 'Digital ordering portal and web interface enabling regional buyers to purchase stock from their phones.',
            impact: 'Expands customer footprint beyond local district storefronts.',
            funding: 'Digital inclusion grants or SME innovation loans.',
            costRange: '800,000 - 3,500,000 RWF',
            minCost: 800000,
            maxCost: 3500000,
            roiTimeframe: '6-9 months',
            financingOptions: ['ICT Development credit lines', 'Telecom incubator grants'],
            marketTrend: 'High mobile money penetration driving mobile commerce',
            implementationComplexity: 'Medium',
            image: 'https://img.yfisher.com/m0/1743574730127-image/png100-t3-scale100.png',
            suppliers: [
              { name: 'Mutoni Web Tech', contact: '+250 785 222 333', website: 'mutoniweb.rw' },
              { name: 'Rwanda App Builders', contact: '+250 789 555 444', website: 'appbuilders.rw' }
            ],
            estimatedProfitIncrease: '30-45% annually',
            maintenanceCost: '120,000 RWF/year',
            estimatedRoiPercentage: 35
          }
        ];
      case 'Logistics':
        return [
          {
            id: 201,
            name: 'GPS Fleet Telematics & Route Optimization',
            description: 'Real-time GPS vehicle trackers combined with AI dispatch software to minimize empty returns and fuel wastage.',
            impact: 'Reduces diesel fuel consumption by 15-22% MoM.',
            funding: 'Asset optimization lease financing.',
            costRange: '600,000 - 2,500,000 RWF',
            minCost: 600000,
            maxCost: 2500000,
            roiTimeframe: '4-6 months',
            financingOptions: ['Asset financier vehicle backing', 'Smart logistics technology loan'],
            marketTrend: 'Stricter delivery lead times demanding route efficiency',
            implementationComplexity: 'Medium',
            image: 'https://www.logisticsinsider.in/wp-content/uploads/2022/07/thumb.jpg',
            suppliers: [
              { name: 'Akagera Telematics', contact: '+250 788 444 555', website: 'akageratelematics.rw' },
              { name: 'Kigali RouteTech', contact: '+250 782 111 222', website: 'routetech.rw' }
            ],
            estimatedProfitIncrease: '20-30% annually',
            maintenanceCost: '80,000 RWF/year',
            estimatedRoiPercentage: 30
          },
          {
            id: 202,
            name: 'Smart Fuel Siphon Anti-Theft Sensors',
            description: 'Capacitive fuel rod sensors fitted to diesel tanks to detect sudden fuel drops or siphon leaks.',
            impact: 'Prevents fuel pilferage representing up to 8% of overhead costs.',
            funding: 'Security asset financing.',
            costRange: '250,000 - 950,000 RWF',
            minCost: 250000,
            maxCost: 950000,
            roiTimeframe: '2-3 months',
            financingOptions: ['Micro-credit logistics lines', 'Cooperative pool credit'],
            marketTrend: 'Increasing operating margins via security audits',
            implementationComplexity: 'Low',
            image: 'https://img.yfisher.com/m0/1743574730127-image/png100-t3-scale100.png',
            suppliers: [
              { name: 'GuardTrack Rwanda', contact: '+250 788 777 888', website: 'guardtrack.rw' }
            ],
            estimatedProfitIncrease: '12-18% annually',
            maintenanceCost: '20,000 RWF/year',
            estimatedRoiPercentage: 24
          }
        ];
      case 'Technology':
        return [
          {
            id: 301,
            name: 'DevOps Automated Cloud Architectures',
            description: 'Scalable cloud server configuration reducing manual hosting costs and downtime.',
            impact: 'Boosts application loading speed and cuts downtime by 99.9%.',
            funding: 'Venture backing or technology-lease funding.',
            costRange: '1,500,000 - 6,000,000 RWF',
            minCost: 1500000,
            maxCost: 6000000,
            roiTimeframe: '6 months',
            financingOptions: ['Tech startup credit facilities', 'Cloud credit sponsorships'],
            marketTrend: 'Rapid shift to microservices and Kubernetes pipelines',
            implementationComplexity: 'High',
            image: 'https://img.yfisher.com/m0/1743574730127-image/png100-t3-scale100.png',
            suppliers: [
              { name: 'Kigali Cloud Consultants', contact: '+250 786 888 999', website: 'kigalicloud.rw' }
            ],
            estimatedProfitIncrease: '25-35% annually',
            maintenanceCost: '150,000 RWF/year',
            estimatedRoiPercentage: 32
          },
          {
            id: 302,
            name: 'AI Support Chatbot Integration',
            description: 'Intelligent natural language processing chatbot handling customer queries 24/7.',
            impact: 'Automates 70% of inbound support questions without increasing headcounts.',
            funding: 'SME digitization grants.',
            costRange: '350,000 - 1,500,000 RWF',
            minCost: 350000,
            maxCost: 1500000,
            roiTimeframe: '3 months',
            financingOptions: ['Innovation development grants', 'Fintech startup incubator loan'],
            marketTrend: 'AI integration replacing traditional support lines',
            implementationComplexity: 'Low',
            image: 'https://cff2.earth.com/uploads/2017/08/09184908/Online-food-shopping-found-to-make-healthy-decisions-easier.jpg',
            suppliers: [
              { name: 'AI Rwanda Developers', contact: '+250 787 333 444', website: 'airwanda.rw' }
            ],
            estimatedProfitIncrease: '15-22% annually',
            maintenanceCost: '30,005 RWF/year',
            estimatedRoiPercentage: 26
          }
        ];
      // Agriculture default (e.g. Rwanda Agro-Processors)
      default:
        return [
          {
            id: 1,
            name: 'Precision Smart Irrigation Systems',
            description: 'Automated solar-powered drip irrigation that conserves water and optimizes crop yield through moisture sensors.',
            impact: 'Boosts production yield by 35% while cutting water expenses in half.',
            funding: 'Government green subsidies (up to 40%) or agri-cooperative credit.',
            costRange: '2,000,000 - 12,000,000 RWF',
            minCost: 2000000,
            maxCost: 12000000,
            roiTimeframe: '1-2 harvest cycles',
            financingOptions: ['BRD Agricultural credit scheme (8% interest)', 'Agri-cooperative credit pool'],
            marketTrend: 'Climate adaptation systems driven by changing weather seasons',
            implementationComplexity: 'Medium',
            image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCz_tM1TpmJOKx3eNVcqtKR_GAkFAHDzxUxw&s',
            suppliers: [
              { name: 'AquaFlow Irrigation Systems', contact: '+250 788 900 100', website: 'aquaflow.rw' },
              { name: 'GreenAgri Rwanda', contact: '+250 782 500 600', website: 'greenagri.rw' }
            ],
            estimatedProfitIncrease: '30-40% annually',
            maintenanceCost: '150,000 RWF/year',
            estimatedRoiPercentage: 35
          },
          {
            id: 3,
            name: 'Solar-Powered Cold Storage Hubs',
            description: 'Low-cost solar cooling containers built directly on cooperative farms to preserve freshness and reduce post-harvest losses.',
            impact: 'Cuts post-harvest produce spoilage by up to 80%, allowing sale at premium prices.',
            funding: 'Development partners (NGO) co-funding grants.',
            costRange: '3,500,000 - 15,000,000 RWF',
            minCost: 3500000,
            maxCost: 15000000,
            roiTimeframe: '1 growing season',
            financingOptions: ['Asset-backed equipment financing', 'UNEP solar agricultural grants'],
            marketTrend: 'Cold chain development critical in sub-Saharan agricultural trade',
            implementationComplexity: 'Medium',
            image: 'https://www.logisticsinsider.in/wp-content/uploads/2022/07/thumb.jpg',
            suppliers: [
              { name: 'StoreFresh Solutions Kigali', contact: '+250 785 456 789', website: 'storefresh.rw' }
            ],
            estimatedProfitIncrease: '35-50% annually',
            maintenanceCost: '220,000 RWF/year',
            estimatedRoiPercentage: 40
          }
        ];
    }
  }, [activeSme]);

  // Optimal financing strategy calculator
  const calculatedFinancing = useMemo(() => {
    if (!selectedTech) return null;
    const avgCost = (selectedTech.minCost + selectedTech.maxCost) / 2;
    const loanAmount = (loanPercentage / 100) * avgCost;
    const ownFundAmount = avgCost - loanAmount;

    // Interest rate matches tech implementation complexity
    const annualInterestRate = selectedTech.implementationComplexity === 'Low' ? 0.12 :
                               selectedTech.implementationComplexity === 'Medium' ? 0.14 : 0.16;

    let periodRate = annualInterestRate / 12;
    let paymentsCount = loanTerm;

    if (repaymentFrequency === 'weekly') {
      periodRate = annualInterestRate / 52;
      paymentsCount = Math.round(loanTerm * 4.33);
    } else if (repaymentFrequency === 'quarterly') {
      periodRate = annualInterestRate / 4;
      paymentsCount = Math.max(1, Math.round(loanTerm / 3));
    }

    const periodicPayment = Math.round(
      loanAmount * (periodRate * Math.pow(1 + periodRate, paymentsCount)) / (Math.pow(1 + periodRate, paymentsCount) - 1)
    );

    const totalInterest = (periodicPayment * paymentsCount) - loanAmount;
    const totalPayment = periodicPayment * paymentsCount;

    // Projected profit boost from this tech
    const annualProfitIncrease = (selectedTech.estimatedRoiPercentage / 100) * avgCost;
    const monthlyProfitIncrease = annualProfitIncrease / 12;

    // Repayment comparison
    let frequencyPaymentInMonth = periodicPayment;
    if (repaymentFrequency === 'weekly') frequencyPaymentInMonth = periodicPayment * 4.33;
    else if (repaymentFrequency === 'quarterly') frequencyPaymentInMonth = periodicPayment / 3;

    const canBeCovered = monthlyProfitIncrease >= frequencyPaymentInMonth;

    return {
      totalCost: avgCost,
      loanAmount,
      ownFundAmount,
      interestRate: annualInterestRate * 100,
      periodicPayment,
      paymentsCount,
      totalInterest,
      totalPayment,
      monthlyProfitIncrease,
      canBeCovered
    };
  }, [selectedTech, loanPercentage, loanTerm, repaymentFrequency]);

  const handleOpenDetails = (tech: TechRecommendation) => {
    setSelectedTech(tech);
  };

  const getTechIcon = (name: string) => {
    if (name.includes('Irrigation')) return <Cpu className="w-6 h-6" />;
    if (name.includes('POS') || name.includes('App')) return <ShoppingCart className="w-6 h-6" />;
    if (name.includes('Fleet') || name.includes('Cold')) return <Truck className="w-6 h-6" />;
    return <Settings className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center justify-center font-heading">
          <Cpu className="w-6 h-6 text-emerald-600 mr-2" /> AI Tech Recommendation Advisor
        </h2>
        <p className="text-xs text-gray-500">
          Tailored equipment, technology upgrades, and financing simulations matching <span className="font-semibold text-emerald-600">{activeSme.name}'s</span> {activeSme.sector} sector operations.
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {sectorRecommendations.map((tech) => (
          <Card key={tech.id} className="bg-white border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition">
            <div className="relative h-48 w-full bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10"></div>
              <img
                src={tech.image}
                alt={tech.name}
                className="w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-4 left-4 z-20">
                <div className="w-10 h-10 bg-white/90 rounded-lg flex items-center justify-center text-emerald-600 shadow-sm">
                  {getTechIcon(tech.name)}
                </div>
              </div>
              <div className="absolute top-4 right-4 z-20 flex space-x-1.5">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  tech.implementationComplexity === 'Low' ? 'bg-emerald-100 text-emerald-800' :
                  tech.implementationComplexity === 'Medium' ? 'bg-amber-100 text-amber-800' :
                  'bg-rose-100 text-rose-800'
                }`}>
                  {tech.implementationComplexity} Complexity
                </span>
                <span className="bg-emerald-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
                  {tech.estimatedRoiPercentage}% ROI
                </span>
              </div>
              <div className="absolute bottom-4 left-4 z-20 text-white">
                <h3 className="font-bold text-base">{tech.name}</h3>
                <p className="text-[10px] text-gray-300">Estimated cost: {tech.costRange}</p>
              </div>
            </div>

            <CardContent className="p-6 space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed">{tech.description}</p>
              <div className="grid grid-cols-2 gap-3 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100 font-mono">
                <div>
                  <span className="text-gray-400 block font-medium font-sans">Yield Impact</span>
                  <span className="font-semibold text-slate-800 block mt-0.5">{tech.impact}</span>
                </div>
                <div>
                  <span className="text-gray-400 block font-medium font-sans">Profit Growth</span>
                  <span className="font-semibold text-emerald-650 block mt-0.5 text-emerald-600">+{tech.estimatedProfitIncrease}</span>
                </div>
              </div>
              <Button
                onClick={() => handleOpenDetails(tech)}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-9.5"
              >
                Inspect ROI & Financing Strategies
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Section */}
      {/* Info Section */}
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 text-xs leading-relaxed">
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-sm flex items-center font-heading">
              <Lightbulb className="w-4 h-4 text-emerald-600 mr-1.5" /> AI Recommendation Reasoning
            </h4>
            <p className="text-slate-650 font-medium">
              Technology recommendations are calculated by mapping capital availability, repayment capacities, and historical overheads. Upgrades aim to resolve structural bottlenecks specific to the {activeSme.sector} sector.
            </p>
          </div>
          <div className="space-y-1.5 text-slate-650 font-semibold">
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
              <span>Tailored supplier contact directories.</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
              <span>Simulated amortization matrices using local bank parameters.</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-4 h-4 text-emerald-500 mr-2 flex-shrink-0" />
              <span>Automatic warning indicator if loan debt service exceeds target ROI.</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal Dialog */}
      {selectedTech && calculatedFinancing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSelectedTech(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative h-44 w-full bg-slate-900">
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent z-10"></div>
              <img
                src={selectedTech.image}
                alt={selectedTech.name}
                className="w-full h-full object-cover opacity-80"
              />
              <button
                onClick={() => setSelectedTech(null)}
                className="absolute top-4 right-4 z-20 w-8 h-8 bg-white/95 rounded-full flex items-center justify-center text-slate-800 font-bold hover:scale-105 transition"
              >
                <XCircle className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 z-20 text-white">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block tracking-widest font-heading">{selectedTech.implementationComplexity} Complexity</span>
                <h3 className="text-xl font-bold font-heading">{selectedTech.name}</h3>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6 text-xs">
              {/* Amortization Strategy Sliders */}
              <div className="space-y-4 border-b border-gray-100 pb-5">
                <h4 className="font-bold text-slate-800 text-sm flex items-center font-heading">
                  <Settings className="w-4.5 h-4.5 text-emerald-600 mr-1.5" /> Amortization & Financing Inputs
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                  <div className="space-y-2">
                    <div className="flex justify-between font-semibold text-gray-500">
                      <span>Financing Coverage (%)</span>
                      <span className="text-emerald-605 font-bold font-mono text-emerald-600">{loanPercentage}%</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="100"
                      step="5"
                      value={loanPercentage}
                      onChange={(e) => setLoanPercentage(Number(e.target.value))}
                      className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-semibold text-gray-500">Repayment Period (months)</label>
                    <input
                      type="number"
                      min="6"
                      max="48"
                      value={loanTerm}
                      onChange={(e) => setLoanTerm(Math.max(1, Number(e.target.value)))}
                      className="w-full p-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block font-semibold text-gray-500">Repayment Frequency</label>
                  <div className="flex space-x-2 font-mono">
                    {(['weekly', 'monthly', 'quarterly'] as const).map(freq => (
                      <button
                        key={freq}
                        onClick={() => setRepaymentFrequency(freq)}
                        className={`px-3 py-1.5 font-bold rounded-lg border text-[11px] transition ${
                          repaymentFrequency === freq
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                            : 'border-gray-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {freq.charAt(0).toUpperCase() + freq.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Financing Projections Card */}
              <div className="space-y-3 font-mono">
                <h4 className="font-bold text-slate-805 text-sm font-heading">Financing Projections</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1 font-sans">AVERAGE COST</span>
                    <span className="font-semibold text-slate-800">{formatRWF(calculatedFinancing.totalCost)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1 font-sans">CREDIT PORTION</span>
                    <span className="font-semibold text-slate-800">{formatRWF(calculatedFinancing.loanAmount)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1 font-sans">DOWNPAYMENT</span>
                    <span className="font-semibold text-slate-800">{formatRWF(calculatedFinancing.ownFundAmount)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <span className="text-[10px] text-gray-400 font-bold block mb-1 font-sans">INTEREST RATE</span>
                    <span className="font-semibold text-slate-800">{calculatedFinancing.interestRate}% fixed</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2">
                    <span className="text-[10px] text-gray-400 font-bold block font-sans">AMORTIZED PAYMENTS</span>
                    <div className="flex justify-between font-semibold">
                      <span className="font-sans">Periodic Amount:</span>
                      <span className="text-slate-900 font-bold">{formatRWF(calculatedFinancing.periodicPayment)}</span>
                    </div>
                    <div className="flex justify-between font-semibold">
                      <span className="font-sans">Total Payments Count:</span>
                      <span className="text-slate-700">{calculatedFinancing.paymentsCount} payments</span>
                    </div>
                    <div className="flex justify-between font-semibold text-rose-600">
                      <span className="font-sans">Accumulated Interest:</span>
                      <span>{formatRWF(calculatedFinancing.totalInterest)}</span>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-2 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold block mb-1.5 font-sans">INVESTMENT SAFETY RATIO</span>
                      <div className="flex justify-between font-semibold">
                        <span className="font-sans">Projected Income Lift:</span>
                        <span className="text-emerald-600 font-bold">+{formatRWF(Math.round(calculatedFinancing.monthlyProfitIncrease))}/mo</span>
                      </div>
                    </div>
                    <div className={`p-2.5 rounded-lg border mt-2 flex items-center space-x-2 font-sans ${
                      calculatedFinancing.canBeCovered
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {calculatedFinancing.canBeCovered ? (
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span className="font-bold text-[10px]">
                        {calculatedFinancing.canBeCovered
                          ? 'Income lift covers repayment debt service.'
                          : 'Warning: Repayment exceeds monthly income boost.'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Verified Suppliers */}
              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="font-bold text-slate-800 text-sm font-heading">Verified Local Vendors</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {selectedTech.suppliers.map((supplier, idx) => (
                    <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                      <span className="font-bold text-slate-800 block text-xs font-heading">{supplier.name}</span>
                      <span className="text-[10px] text-gray-500 block mt-1">Tel: {supplier.contact}</span>
                      <a href={`https://${supplier.website}`} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-600 font-bold hover:underline mt-1 block">
                        {supplier.website}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
