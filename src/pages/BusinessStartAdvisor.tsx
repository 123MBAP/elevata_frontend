import { useState } from 'react';
import { motion } from 'framer-motion';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '../assets/components/ui/button';
import { Card, CardContent } from '../assets/components/ui/card';
import { Input } from '../assets/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../assets/components/ui/tabs';
import { formatRWF } from '../lib/mockData';
import { MapPin, Lightbulb, Compass, ArrowRight } from 'lucide-react';

interface TrendData {
  name: string;
  value: number;
}

interface LocationData {
  name: string;
  rent: number;
  demand: string;
  roi: string;
  setup: string;
  trend: TrendData[];
}

const businessTrends = [
  { name: 'Jan', value: 1200000 },
  { name: 'Feb', value: 2300000 },
  { name: 'Mar', value: 3200000 },
  { name: 'Apr', value: 4200000 },
  { name: 'May', value: 5300000 },
  { name: 'Jun', value: 6500000 },
];

const businessTypes = [
  {
    id: 1,
    name: 'Grocery Store / Mini Mart',
    capital: 3000000,
    equipment: ['Weighing Scale', 'Display Shelves', 'Freezer Chest', 'POS Inventory'],
    staffing: '1-2 employees',
    marketing: 'Neighborhood signage & loyalty cards',
    location: 'Kigali - Kicukiro - Sonatube',
    trend: businessTrends,
  },
  {
    id: 2,
    name: 'Coffee Shop & Cafe',
    capital: 6500000,
    equipment: ['Espresso Brewer', 'Pastry Showcase', 'Tables & Stools'],
    staffing: '2-3 employees',
    marketing: 'Social influencer reviews & free WiFi marketing',
    location: 'Kigali - Nyarugenge - Downtown',
    trend: businessTrends.map(item => ({ ...item, value: Math.round(item.value * 0.8) })),
  },
  {
    id: 3,
    name: 'Phone Accessories & Repair Shop',
    capital: 1500000,
    equipment: ['Soldering Station', 'Lockable Display Cabinets', 'Basic Spares Kit'],
    staffing: '1 technician',
    marketing: 'Google Maps SEO & flyer placement',
    location: 'Kigali - Gasabo - Remera',
    trend: businessTrends.map(item => ({ ...item, value: Math.round(item.value * 1.2) })),
  },
];

const locations: LocationData[] = [
  {
    name: 'Nyabugogo Bus Terminal',
    rent: 250000,
    demand: 'Very High',
    roi: '35% monthly projection',
    setup: 'Retail Booth + High-Volume Stock',
    trend: businessTrends,
  },
  {
    name: 'Kimironko Market Area',
    rent: 200000,
    demand: 'High',
    roi: '28% monthly projection',
    setup: 'Storefront + Outdoor Banner Display',
    trend: businessTrends.map(item => ({ ...item, value: Math.round(item.value * 0.95) })),
  },
  {
    name: 'Nyamirambo Commercial Strip',
    rent: 150000,
    demand: 'Medium-High',
    roi: '25% monthly projection',
    setup: 'Standard Kiosk + Basic Shell inventory',
    trend: businessTrends.map(item => ({ ...item, value: Math.round(item.value * 1.1) })),
  },
];

const SimpleMap = ({
  locationsData,
  selectedLocation,
  onSelectLocation
}: {
  locationsData: LocationData[];
  selectedLocation: string;
  onSelectLocation: (name: string) => void;
}) => {
  return (
    <div className="relative w-full h-60 bg-emerald-50/30 rounded-2xl overflow-hidden mt-4 border border-emerald-100 flex items-center justify-center">
      {/* Visual background simulation */}
      <div className="absolute inset-0 bg-slate-100/50 grid grid-cols-6 grid-rows-6 opacity-30 pointer-events-none">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-300"></div>
        ))}
      </div>

      <div className="absolute inset-0">
        {locationsData.map((loc, idx) => (
          <button
            key={idx}
            className={`absolute px-3 py-1.5 rounded-full border-2 border-white flex items-center space-x-1 shadow-md text-[10px] font-bold transition ${
              selectedLocation === loc.name ? 'bg-emerald-600 text-white scale-105' : 'bg-white text-slate-800 hover:bg-slate-50'
            }`}
            style={{
              left: `${15 + idx * 25}%`,
              top: `${25 + (idx % 2) * 35}%`,
            }}
            onClick={() => onSelectLocation(loc.name)}
          >
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{loc.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>
      <div className="absolute bottom-3 left-3 bg-white/95 px-3 py-1 rounded-xl shadow text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center">
        <Compass className="w-3.5 h-3.5 mr-1 text-emerald-600" />
        <span>Kigali District Heatmap Simulation</span>
      </div>
    </div>
  );
};

export default function BusinessStartAdvisor() {
  const [activeTab, setActiveTab] = useState('type');
  const [capital, setCapital] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Nyabugogo Bus Terminal');

  const handleGetSuggestions = () => {
    if (!capital) return;
    alert(`AI engine calculating business types for startup budget: ${formatRWF(Number(capital))}...`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Business Startup & Location Planner</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Identify profitable industries, analyze rental trends, and estimate startup budget allocations in Kigali.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="bg-white border border-gray-150 shadow-sm rounded-xl p-1 grid grid-cols-2">
          <TabsTrigger value="type" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs py-2 rounded-lg">
            Business Model Advisor
          </TabsTrigger>
          <TabsTrigger value="location" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white font-bold text-xs py-2 rounded-lg">
            Kigali Location Heatmap
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Business type */}
        <TabsContent value="type">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <Card className="bg-white border border-gray-100 shadow-sm mb-6">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center">
                  <Lightbulb className="w-4.5 h-4.5 text-emerald-600 mr-2" /> Find the Right Business Model
                </h3>
                <div className="flex flex-col sm:flex-row gap-4 items-end text-xs">
                  <div className="flex-1 space-y-1.5">
                    <label className="block text-gray-500 font-semibold">Available Capital (RWF)</label>
                    <Input
                      placeholder="e.g. 3000000"
                      value={capital}
                      onChange={(e) => setCapital(e.target.value)}
                      type="number"
                      className="border-gray-200 h-9.5"
                    />
                  </div>
                  <Button
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9.5 shadow flex items-center justify-center px-6"
                    onClick={handleGetSuggestions}
                  >
                    <span>Assess Models</span>
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">AI Recommended Models</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {businessTypes.map((biz) => (
                <Card key={biz.id} className="bg-white border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="p-4 bg-emerald-50/20 border-b border-gray-100">
                    <h4 className="text-xs font-bold text-emerald-700">{biz.name}</h4>
                  </div>
                  <div className="p-4 space-y-4 text-xs">
                    <ul className="space-y-2 text-gray-600 font-medium">
                      <li className="flex justify-between">
                        <span>Setup Capital:</span>
                        <strong className="text-slate-800">{formatRWF(biz.capital)}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Staffing:</span>
                        <strong className="text-slate-800">{biz.staffing}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Marketing:</span>
                        <strong className="text-slate-800 truncate max-w-[120px]" title={biz.marketing}>{biz.marketing}</strong>
                      </li>
                    </ul>

                    <div className="pt-2.5 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase mb-1">Recommended Equipment</span>
                      <div className="flex flex-wrap gap-1">
                        {biz.equipment.map((eq, i) => (
                          <span key={i} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-[9px] font-semibold">
                            {eq}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase mb-2">6-Month Income Trend</span>
                      <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={biz.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                            <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(val: any) => [formatRWF(Number(val)), 'Income']} contentStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="value" stroke="#10B981" fill="#ECFDF5" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>

        {/* Tab 2: Locations Map */}
        <TabsContent value="location">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25 }}>
            <SimpleMap
              locationsData={locations}
              selectedLocation={selectedLocation}
              onSelectLocation={setSelectedLocation}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {locations.map((loc) => (
                <Card
                  key={loc.name}
                  onClick={() => setSelectedLocation(loc.name)}
                  className={`bg-white cursor-pointer overflow-hidden transition ${
                    selectedLocation === loc.name ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500' : 'border-gray-100 shadow-sm'
                  }`}
                >
                  <div className={`p-4 border-b border-gray-100 ${
                    selectedLocation === loc.name ? 'bg-emerald-50/10' : 'bg-gray-50/20'
                  }`}>
                    <h4 className="text-xs font-bold text-slate-800">{loc.name}</h4>
                  </div>
                  <div className="p-4 space-y-4 text-xs">
                    <ul className="space-y-2 text-gray-600 font-medium">
                      <li className="flex justify-between">
                        <span>Avg Rent:</span>
                        <strong className="text-slate-850">{formatRWF(loc.rent)}/mo</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Traffic/Demand:</span>
                        <strong className="text-slate-850">{loc.demand}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Expected ROI:</span>
                        <strong className="text-slate-850">{loc.roi}</strong>
                      </li>
                      <li className="flex justify-between">
                        <span>Suggested Setup:</span>
                        <strong className="text-slate-850 truncate max-w-[130px]" title={loc.setup}>{loc.setup}</strong>
                      </li>
                    </ul>

                    <div className="pt-2.5 border-t border-gray-50">
                      <span className="text-[10px] text-gray-400 font-bold block uppercase mb-2">Demand Runway Projections</span>
                      <div className="h-28 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={loc.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F9FAFB" />
                            <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                            <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`} />
                            <Tooltip formatter={(val: any) => [formatRWF(Number(val)), 'Demand Volume']} contentStyle={{ fontSize: '10px' }} />
                            <Area type="monotone" dataKey="value" stroke="#10B981" fill="#ECFDF5" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        </TabsContent>
      </Tabs>
    </div>
  );
}