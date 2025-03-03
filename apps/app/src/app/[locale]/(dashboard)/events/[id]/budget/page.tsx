'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Import our hooks
import { useBudgetData } from './hooks/useBudgetData';
import { useEventVendors } from './hooks/useEventVendors';
import { useActivityTracker } from './hooks/useActivityTracker';
import { useParticipantsCount } from './hooks/useParticipantsCount';

// Import components
import { PageHeader } from './components/PageHeader';
import { BudgetSummary } from './components/BudgetSummary';
import { AddBudgetItemForm } from './components/AddBudgetItemForm';
import { BudgetItemsList } from './components/BudgetItemsList';
import { ExportMenu } from './components/ExportMenu';

// Import colors
import { colors } from '@/styles/colors';

// Load state components
function LoadingState() {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="flex items-center space-x-4">
          <div className="h-5 w-5 animate-spin rounded-full border-b-2" style={{ borderColor: colors.primary.default }}></div>
          <p className="text-gray-400">Loading budget data...</p>
        </div>
      </div>
    );
  }
  
function ErrorState({ error, eventId }: { error: string, eventId: string }) {
    return (
      <div className="w-full max-w-3xl mx-auto p-6">
        <div className="mb-6">
          <Link 
            href={`/en/events/${eventId}`}
            className="inline-flex items-center text-sm text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1.5">
              <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back to event
          </Link>
        </div>
        
        <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      </div>
    );
}

export default function EventBudgetPage() {
  const params = useParams();
  const eventId = params.id as string;
  
  // Use our custom hooks
  const {
    budgetItems,
    isLoading,
    error,
    eventName,
    totals,
    categories,
    totalBudgetValue,
    setTotalBudgetValue,
    participantCount,
    actions: budgetActions
  } = useBudgetData(eventId);
  
  const {
    eventVendors,
    getVendorName
  } = useEventVendors(eventId);
  
  const {
    loading: participantsLoading
  } = useParticipantsCount(eventId);
  
  // Set up refresh function that calls both data fetches
  const refreshData = async () => {
    await budgetActions.fetchBudgetData();
  };
  
  // Set up activity tracking
  const { trackUserActivity } = useActivityTracker(refreshData);
  
  // Local UI state
  const [isAddingItem, setIsAddingItem] = useState(false);
  
  // Loading and error states
  if (isLoading) {
    return <LoadingState />;
  }
  
  if (error) {
    return <ErrorState error={error} eventId={eventId} />;
  }
  
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <PageHeader eventId={eventId} eventName={eventName} />
      
      <BudgetSummary
        totalBudgetValue={totalBudgetValue}
        setTotalBudgetValue={setTotalBudgetValue}
        totals={totals}
        onAddItem={() => setIsAddingItem(true)}
        onSaveTotalBudget={budgetActions.updateTotalBudget}
        trackUserActivity={trackUserActivity}
        participantCount={participantCount}
      />
      
      {isAddingItem && (
        <AddBudgetItemForm
          categories={categories}
          vendors={eventVendors}
          onAdd={budgetActions.addBudgetItem}
          onCancel={() => setIsAddingItem(false)}
          trackUserActivity={trackUserActivity}
        />
      )}
      
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-md font-medium text-white">Budget Items</h2>
        
        <ExportMenu
          items={budgetItems}
          totals={totals}
          eventName={eventName}
          getVendorName={getVendorName}
          trackUserActivity={trackUserActivity}
        />
      </div>
      
      <BudgetItemsList
        items={budgetItems}
        categories={categories}
        getVendorName={getVendorName}
        onUpdateAmount={budgetActions.updateActualAmount}
        onTogglePaid={budgetActions.togglePaidStatus}
        onDeleteItem={budgetActions.deleteBudgetItem}
        trackUserActivity={trackUserActivity}
        participantCount={participantCount}
      />
    </div>
  );
}