import React, { createContext, useContext, useState, useEffect } from 'react';
import { SmeProfile, mockSmes, Sale, InventoryItem, formatRWF } from '../lib/mockData';

interface Scenarios {
  salesDrop: boolean;
  expenseIncrease: boolean;
  loanDelay: boolean;
}

interface LoanSimulation {
  amount: number;      // in RWF
  period: number;      // in months
  rate: number;        // in %
}

interface AppContextType {
  selectedSmeId: string;
  setSelectedSmeId: (id: string) => void;
  smes: SmeProfile[];
  activeSme: SmeProfile;
  scenarios: Scenarios;
  setScenarios: React.Dispatch<React.SetStateAction<Scenarios>>;
  loanSimulation: LoanSimulation;
  setLoanSimulation: React.Dispatch<React.SetStateAction<LoanSimulation>>;
  approveLoan: (smeId: string, amount: number, period: number, rate: number) => void;
  rejectLoan: (smeId: string) => void;
  requestFieldVisit: (smeId: string) => void;
  addSale: (smeId: string, product: string, quantity: number, price: number, customer: string) => void;
  deleteSale: (smeId: string, saleId: number) => void;
  addInventoryItem: (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => void;
  deleteInventoryItem: (smeId: string, itemId: string) => void;
  resetAll: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedSmeId, setSelectedSmeId] = useState<string>(() => {
    return localStorage.getItem('elevata_sme_id') || 'sme-1';
  });

  const [smes, setSmes] = useState<SmeProfile[]>(() => {
    const saved = localStorage.getItem('elevata_smes');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((sme: any) => {
            const defaultSme = mockSmes.find(m => m.id === sme.id) || mockSmes[0];
            return {
              ...defaultSme,
              ...sme,
              inventoryItems: Array.isArray(sme.inventoryItems) ? sme.inventoryItems : (defaultSme.inventoryItems || []),
              sales: Array.isArray(sme.sales) ? sme.sales : (defaultSme.sales || []),
              riskAlerts: Array.isArray(sme.riskAlerts) ? sme.riskAlerts : (defaultSme.riskAlerts || []),
              monthlyData: Array.isArray(sme.monthlyData) ? sme.monthlyData : (defaultSme.monthlyData || []),
              loanDetails: {
                ...defaultSme.loanDetails,
                ...(sme.loanDetails || {})
              }
            };
          });
        }
      } catch (e) {
        console.error("Failed to parse saved SMEs from localStorage:", e);
      }
    }
    return mockSmes;
  });

  const [scenarios, setScenarios] = useState<Scenarios>({
    salesDrop: false,
    expenseIncrease: false,
    loanDelay: false,
  });

  const [loanSimulation, setLoanSimulation] = useState<LoanSimulation>({
    amount: 5000000, // 5M RWF default
    period: 12,       // 1 year
    rate: 15,         // 15% fixed
  });

  // Keep local storage in sync
  useEffect(() => {
    localStorage.setItem('elevata_sme_id', selectedSmeId);
  }, [selectedSmeId]);

  useEffect(() => {
    localStorage.setItem('elevata_smes', JSON.stringify(smes));
  }, [smes]);

  const activeSme = smes.find(sme => sme.id === selectedSmeId) || smes[0];

  const approveLoan = (smeId: string, amount: number, period: number, rate: number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const monthlyInstallment = Math.round((amount * (1 + (rate / 100))) / period);
        
        const updatedAlerts = [
          {
            id: `alert-loan-app-${Date.now()}`,
            type: 'info' as const,
            text: `Elevata Alert: Credit of ${new Intl.NumberFormat().format(amount)} FRW approved at ${rate}% interest over ${period} months. Funds credited.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          currentBalance: sme.currentBalance + amount,
          borrowingCapacity: Math.max(0, sme.borrowingCapacity - amount),
          healthScore: Math.min(100, Math.round(sme.healthScore * 1.05)),
          loanDetails: {
            status: 'Active',
            outstandingAmount: amount,
            monthlyInstallment,
            interestRate: rate,
            repaymentPeriodMonths: period,
            purpose: 'Approved credit facility expansion'
          },
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const rejectLoan = (smeId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        return {
          ...sme,
          riskAlerts: [
            {
              id: `alert-loan-rej-${Date.now()}`,
              type: 'danger' as const,
              text: 'Elevata System notice: Credit expansion request was declined by risk officer.'
            },
            ...sme.riskAlerts
          ]
        };
      }
      return sme;
    }));
  };

  const requestFieldVisit = (smeId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        return {
          ...sme,
          riskAlerts: [
            {
              id: `alert-visit-${Date.now()}`,
              type: 'warning' as const,
              text: 'Elevata System alert: Bank compliance officer has scheduled a local inventory verification field audit.'
            },
            ...sme.riskAlerts
          ]
        };
      }
      return sme;
    }));
  };

  const addSale = (smeId: string, product: string, quantity: number, price: number, customer: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const total = quantity * price;
        const newSale: Sale = {
          id: Date.now(),
          product,
          quantity,
          price,
          total,
          date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
          customer,
          status: 'Completed'
        };

        // Decrement matching inventory item if it exists
        const updatedInventory = sme.inventoryItems.map(item => {
          if (item.name.toLowerCase() === product.toLowerCase() || item.name.toLowerCase().includes(product.toLowerCase())) {
            const newStock = Math.max(0, item.stockLevel - quantity);
            let newStatus: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Overstock' = 'In Stock';
            if (newStock === 0) newStatus = 'Out of Stock';
            else if (newStock <= item.reorderPoint) newStatus = 'Low Stock';
            else if (newStock > item.reorderPoint * 2.5) newStatus = 'Overstock';

            const avgDailySales = Math.max(0.1, quantity / 7);
            const newDays = Math.round(newStock / avgDailySales);

            return {
              ...item,
              stockLevel: newStock,
              status: newStatus,
              daysRemaining: newDays
            };
          }
          return item;
        });

        const updatedAlerts = [
          {
            id: `alert-sale-${Date.now()}`,
            type: 'info' as const,
            text: `Transaction completed: Sold ${quantity}x ${product} to ${customer}. Reserves credited by ${formatRWF(total)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            revenue: currentMonth.revenue + total,
            inflow: currentMonth.inflow + total
          };
        }

        return {
          ...sme,
          currentBalance: sme.currentBalance + total,
          inventoryItems: updatedInventory,
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          sales: [newSale, ...sme.sales]
        };
      }
      return sme;
    }));
  };

  const deleteSale = (smeId: string, saleId: number) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const saleToDelete = sme.sales.find(s => s.id === saleId);
        if (!saleToDelete) return sme;

        const updatedAlerts = [
          {
            id: `alert-sale-del-${Date.now()}`,
            type: 'warning' as const,
            text: `Transaction reversed: Sale of ${saleToDelete.product} was cancelled. Reserves debited by ${formatRWF(saleToDelete.total)}.`
          },
          ...sme.riskAlerts
        ];

        const updatedMonthlyData = [...sme.monthlyData];
        if (updatedMonthlyData.length > 0) {
          const currentMonth = updatedMonthlyData[updatedMonthlyData.length - 1];
          updatedMonthlyData[updatedMonthlyData.length - 1] = {
            ...currentMonth,
            revenue: Math.max(0, currentMonth.revenue - saleToDelete.total),
            inflow: Math.max(0, currentMonth.inflow - saleToDelete.total)
          };
        }

        return {
          ...sme,
          currentBalance: Math.max(0, sme.currentBalance - saleToDelete.total),
          riskAlerts: updatedAlerts,
          monthlyData: updatedMonthlyData,
          sales: sme.sales.filter(s => s.id !== saleId)
        };
      }
      return sme;
    }));
  };

  const addInventoryItem = (smeId: string, name: string, category: string, quantity: number, price: number, supplier: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          name,
          stockLevel: quantity,
          status: quantity === 0 ? 'Out of Stock' : quantity <= 10 ? 'Low Stock' : 'In Stock',
          daysRemaining: quantity * 2,
          reorderPoint: 10,
          unitPrice: price,
          category,
          supplier
        };

        const updatedAlerts = [
          {
            id: `alert-inv-add-${Date.now()}`,
            type: 'info' as const,
            text: `Inventory restocked: Added ${quantity}x ${name} to stock catalog.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          inventoryItems: [...sme.inventoryItems, newItem],
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const deleteInventoryItem = (smeId: string, itemId: string) => {
    setSmes(prev => prev.map(sme => {
      if (sme.id === smeId) {
        const itemToDelete = sme.inventoryItems.find(i => i.id === itemId);
        if (!itemToDelete) return sme;

        const updatedAlerts = [
          {
            id: `alert-inv-del-${Date.now()}`,
            type: 'warning' as const,
            text: `Inventory catalog update: Removed ${itemToDelete.name} from active tracking.`
          },
          ...sme.riskAlerts
        ];

        return {
          ...sme,
          inventoryItems: sme.inventoryItems.filter(i => i.id !== itemId),
          riskAlerts: updatedAlerts
        };
      }
      return sme;
    }));
  };

  const resetAll = () => {
    setSmes(mockSmes);
    setSelectedSmeId('sme-1');
    setScenarios({ salesDrop: false, expenseIncrease: false, loanDelay: false });
    setLoanSimulation({ amount: 5000000, period: 12, rate: 15 });
  };

  return (
    <AppContext.Provider value={{
      selectedSmeId,
      setSelectedSmeId,
      smes,
      activeSme,
      scenarios,
      setScenarios,
      loanSimulation,
      setLoanSimulation,
      approveLoan,
      rejectLoan,
      requestFieldVisit,
      addSale,
      deleteSale,
      addInventoryItem,
      deleteInventoryItem,
      resetAll
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppContextProvider');
  }
  return context;
};
