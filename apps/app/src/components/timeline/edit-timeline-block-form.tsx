'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  timelineBlockSchema, 
  timelineBlockSchema15Min,
  TimelineBlockFormValues, 
  roundToTimeInterval,
  TimePrecision 
} from '../../lib/validations/timeline-block-schema';
import { TimelineBlock } from '../../types/timeline';
import { formatDateTimeForInput, localToUTCString } from '../../utils/timezone-utils';

// Get status-specific styling in Linear fashion
function getStatusStyles(status: string) {
  switch (status) {
    case 'pending':
      return {
        active: 'bg-theme-status-pending-bg text-theme-status-pending-text border border-theme-status-pending-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
    case 'in-progress':
      return {
        active: 'bg-theme-status-in-progress-bg text-theme-status-in-progress-text border border-theme-status-in-progress-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
    case 'complete':
      return {
        active: 'bg-theme-status-confirmed-bg text-theme-status-confirmed-text border border-theme-status-confirmed-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
    case 'cancelled':
      return {
        active: 'bg-theme-status-cancelled-bg text-theme-status-cancelled-text border border-theme-status-cancelled-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
    case 'draft':
      return {
        active: 'bg-theme-status-draft-bg text-theme-status-draft-text border border-theme-status-draft-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
    default:
      return {
        active: 'bg-theme-status-draft-bg text-theme-status-draft-text border border-theme-status-draft-text/20',
        inactive: 'bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong'
      };
  }
}

interface EditTimelineBlockFormProps {
  eventId: string;
  blockId: string;
  block: TimelineBlock;
}

export function EditTimelineBlockForm({ eventId, blockId, block }: EditTimelineBlockFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precision, setPrecision] = useState<TimePrecision>('30min');
  
  // Calculate default times based on precision
  const getDefaultTimes = (precision: TimePrecision, startTime: string, endTime: string) => {
    // Pass the original ISO strings directly to formatDateTimeForInput
    // to preserve the original hours without timezone conversion
    console.log('Getting default times from:', { startTime, endTime });
    
    if ((startTime.endsWith('Z') || startTime.includes('+00:00')) &&
        (endTime.endsWith('Z') || endTime.includes('+00:00'))) {
      // For UTC times, format directly from the ISO strings to preserve hours
      return {
        start: formatDateTimeForInput(startTime),
        end: formatDateTimeForInput(endTime)
      };
    }
    
    // Fallback to the original approach for non-UTC times
    const start = new Date(startTime);
    const end = new Date(endTime);
    
    const roundedStart = roundToTimeInterval(start, precision);
    const roundedEnd = roundToTimeInterval(end, precision);
    
    return {
      start: formatDateTimeForInput(roundedStart),
      end: formatDateTimeForInput(roundedEnd)
    };
  };

  const defaultTimes = getDefaultTimes(precision, block.startTime.toString(), block.endTime.toString());
  
  // Form with zod validation
  const form = useForm<TimelineBlockFormValues>({
    resolver: zodResolver(precision === '15min' ? timelineBlockSchema15Min : timelineBlockSchema),
    defaultValues: {
      eventId: eventId,
      title: block.title,
      startTime: defaultTimes.start,
      endTime: defaultTimes.end,
      location: block.location || '',
      description: block.description || '',
      status: (block.status as "pending" | "in-progress" | "complete" | "cancelled") || "pending",
      personnel: block.personnel || '',
      equipment: block.equipment || '',
      notes: block.notes || '',
    },
  });

  // Update form validation and times when precision changes
  useEffect(() => {
    const schema = precision === '15min' ? timelineBlockSchema15Min : timelineBlockSchema;
    form.clearErrors();
    
    // Get current times
    const currentStart = new Date(form.getValues().startTime);
    const currentEnd = new Date(form.getValues().endTime);
    
    // Round to new precision
    const roundedStart = roundToTimeInterval(currentStart, precision);
    const roundedEnd = roundToTimeInterval(currentEnd, precision);
    
    // Check if end time needs adjustment to maintain proper interval
    const diffMs = roundedEnd.getTime() - roundedStart.getTime();
    const minimumIntervalMs = precision === '15min' ? 15 * 60 * 1000 : 30 * 60 * 1000;
    
    // If interval is too small after rounding, adjust end time
    if (diffMs < minimumIntervalMs) {
      const adjustedEnd = new Date(roundedStart);
      if (precision === '15min') {
        adjustedEnd.setMinutes(roundedStart.getMinutes() + 15);
      } else {
        adjustedEnd.setMinutes(roundedStart.getMinutes() + 30);
      }
      form.setValue('endTime', formatDateTimeForInput(adjustedEnd));
    } else {
      form.setValue('endTime', formatDateTimeForInput(roundedEnd));
    }
    
    form.setValue('startTime', formatDateTimeForInput(roundedStart));
    
  }, [precision, form]);
  
  // Handle form submission
  async function onSubmit(values: TimelineBlockFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      // Use our utility to convert local input times to ISO strings
      // while preserving the actual times entered by the user
      const sanitizedValues = {
        ...values,
        startTime: localToUTCString(values.startTime),
        endTime: localToUTCString(values.endTime),
        precision
      };
      
      // Add debug info about timezones and times
      console.log('Form submission details:', {
        rawStartTime: values.startTime,
        rawEndTime: values.endTime,
        sanitizedStartTime: sanitizedValues.startTime,
        sanitizedEndTime: sanitizedValues.endTime,
        precision,
        localTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        browserLocale: navigator.language
      });
      
      // Delete the existing block using the specific blockId route
      const deleteResponse = await fetch(`/api/events/${eventId}/timeline/${blockId}`, {
        method: 'DELETE',
      });
      
      if (!deleteResponse.ok) {
        // Improved error handling
        let errorMessage = 'Failed to delete existing timeline block';
        try {
          const errorData = await deleteResponse.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Error ${deleteResponse.status}: ${deleteResponse.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
      
      // Then create a new block with the updated data
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedValues),
      });
      
      if (!response.ok) {
        // Improved error handling
        let errorMessage = 'Failed to update timeline block';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
      
      // Use setTimeout to delay navigation slightly, avoiding hydration issues
      setTimeout(() => {
        router.push(`/en/events/${eventId}/timeline`);
        router.refresh();
      }, 0);
    } catch (err) {
      console.error("Error updating timeline block:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }
  
  // Handle block deletion
  async function deleteBlock() {
    setIsDeleting(true);
    setError(null);
    
    try {
      // Use the specific blockId route 
      const response = await fetch(`/api/events/${eventId}/timeline/${blockId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // Improved error handling
        let errorMessage = 'Failed to delete timeline block';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, use status text
          errorMessage = `Error ${response.status}: ${response.statusText || errorMessage}`;
        }
        throw new Error(errorMessage);
      }
      
      // Use setTimeout to delay navigation slightly, avoiding hydration issues
      setTimeout(() => {
        router.push(`/en/events/${eventId}/timeline`);
        router.refresh();
      }, 0);
    } catch (err) {
      console.error("Error deleting timeline block:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  }
  
  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Error display */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}
        
        {/* Title field */}
        <div className="space-y-2">
          <label htmlFor="title" className="text-[13px] font-medium text-gray-400">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...form.register('title')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
            placeholder="Enter block title"
            autoFocus
          />
          {form.formState.errors.title && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.title.message}</p>
          )}
        </div>
        
        {/* Time fields with precision toggle */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-[13px] font-medium text-gray-400">Time</label>
            
            {/* Linear-style precision toggle with improved disclosure */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setPrecision(precision === '30min' ? '15min' : '30min')}
                className="text-[12px] flex items-center gap-1.5 px-2 py-1 rounded transition-colors duration-120 border border-transparent bg-[#141414] hover:bg-[#1E1E1E] hover:border-[#333333] text-gray-400 hover:text-white"
                aria-label={`Switch to ${precision === '30min' ? '15-minute' : '30-minute'} blocks`}
              >
                {/* Clock icon */}
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-70">
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                
                <span className={precision === '15min' ? 'text-[#5E6AD2]' : ''}>
                  {precision === '30min' ? '30-min' : '15-min'}
                </span>
                
                {/* Subtle toggle indicator */}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-60">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Tooltip on hover - Linear style */}
              <div className="absolute right-0 top-full mt-1 w-48 p-2 bg-[#1E1E1E] border border-[#333333] rounded shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 text-[11px] leading-tight text-gray-300 z-10">
                Toggle between 15-minute and 30-minute time blocks for more precise scheduling
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="startTime" className="text-[13px] font-medium text-gray-400">
                Start Time
              </label>
              <input
                id="startTime"
                type="datetime-local"
                {...form.register('startTime')}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120 text-[14px] font-mono"
              />
              {form.formState.errors.startTime && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.startTime.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label htmlFor="endTime" className="text-[13px] font-medium text-gray-400">
                End Time
              </label>
              <input
                id="endTime"
                type="datetime-local"
                {...form.register('endTime')}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120 text-[14px] font-mono"
              />
              {form.formState.errors.endTime && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>
          
          <div className="mt-1 flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#282828] flex items-center justify-center">
              <div className={`w-1.5 h-1.5 rounded-full ${precision === '15min' ? 'bg-[#5E6AD2]' : 'bg-gray-500'}`}></div>
            </div>
            <span className="text-xs text-gray-500">
              {precision === '15min' 
                ? 'Times align to 15-minute intervals (XX:00, XX:15, XX:30, XX:45)'
                : 'Times align to 30-minute intervals (XX:00, XX:30)'}
            </span>
          </div>
        </div>
        
        {/* Location field */}
        <div className="space-y-2">
          <label htmlFor="location" className="text-[13px] font-medium text-gray-400">
            Location <span className="text-gray-600">(Optional)</span>
          </label>
          <input
            id="location"
            type="text"
            {...form.register('location')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
            placeholder="Enter specific location (if different from event location)"
          />
        </div>
        
        {/* Personnel field */}
        <div className="space-y-2">
          <label htmlFor="personnel" className="text-[13px] font-medium text-gray-400">
            Personnel <span className="text-gray-600">(Optional)</span>
          </label>
          <input
            id="personnel"
            type="text"
            {...form.register('personnel')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
            placeholder="Enter personnel responsible for this block"
          />
        </div>
        
        {/* Equipment field */}
        <div className="space-y-2">
          <label htmlFor="equipment" className="text-[13px] font-medium text-gray-400">
            Equipment <span className="text-gray-600">(Optional)</span>
          </label>
          <input
            id="equipment"
            type="text"
            {...form.register('equipment')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
            placeholder="Enter equipment needed for this block"
          />
        </div>
        
        {/* Status field */}
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-400">
            Status
          </label>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in-progress', 'complete', 'cancelled'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => form.setValue('status', status)}
                className={`px-3 py-1.5 text-[13px] rounded-md transition-colors duration-150 border ${
                  form.watch('status') === status 
                    ? status === 'complete' 
                      ? 'bg-theme-status-confirmed-bg text-theme-status-confirmed-text border-theme-status-confirmed-text/20'
                      : status === 'cancelled'
                        ? 'bg-theme-status-cancelled-bg text-theme-status-cancelled-text border-theme-status-cancelled-text/20'
                        : status === 'in-progress'
                          ? 'bg-theme-status-in-progress-bg text-theme-status-in-progress-text border-theme-status-in-progress-text/20'
                          : 'bg-theme-status-pending-bg text-theme-status-pending-text border-theme-status-pending-text/20'
                    : 'bg-transparent text-theme-text-tertiary border-theme-border-subtle hover:text-theme-text-secondary hover:border-theme-border-strong'
                }`}
              >
                {status === 'in-progress' ? 'In Progress' : status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <div className="mt-2 text-[12px] text-gray-500 flex items-center">
            <svg className="w-3.5 h-3.5 mr-1.5 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {form.watch('status') === 'pending' 
              ? 'Block is scheduled but not started'
              : form.watch('status') === 'in-progress' 
                ? 'Block is currently in progress'
                : form.watch('status') === 'complete'
                  ? 'Block has been completed'
                  : 'Block has been cancelled'}
          </div>
        </div>
        
        {/* Description field */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-[13px] font-medium text-gray-400">
            Description <span className="text-gray-600">(Optional)</span>
          </label>
          <textarea
            id="description"
            {...form.register('description')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 min-h-[100px] resize-y text-[14px] leading-relaxed"
            placeholder="Enter additional details, instructions, or notes"
          />
        </div>
        
        {/* Notes field */}
        <div className="space-y-2">
          <label htmlFor="notes" className="text-[13px] font-medium text-gray-400">
            Notes <span className="text-gray-600">(Optional)</span>
          </label>
          <textarea
            id="notes"
            {...form.register('notes')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 min-h-[100px] resize-y text-[14px] leading-relaxed"
            placeholder="Enter any additional notes for this block"
          />
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between items-center border-t border-[#1F1F1F] pt-6 mt-2">
          {/* Delete button */}
          <button
            type="button"
            onClick={deleteBlock}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-md transition-colors duration-120 border border-red-500/20 text-[14px] font-medium flex items-center gap-1.5"
          >
            {isDeleting ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Deleting...
              </span>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" 
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Delete Block
              </>
            )}
          </button>
          
          {/* Save button */}
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white rounded-md transition-colors duration-120 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium border border-transparent hover:border-[#8D95F2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_12px_rgba(94,106,210,0.2)]"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
} 