'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  timelineBlockSchema, 
  timelineBlockSchema15Min,
  TimelineBlockFormValues, 
  roundToTimeInterval,
  TimePrecision 
} from '../../lib/validations/timeline-block-schema';
import { formatDateTimeForInput, localToUTCString } from '../../utils/timezone-utils';

// Get status-specific styling in Linear fashion
function getStatusStyles(status: string) {
  switch (status) {
    case 'pending':
      return {
        active: "bg-theme-status-pending-bg text-theme-status-pending-text border border-theme-status-pending-text/20",
        inactive: "bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong"
      };
    case 'in-progress':
      return {
        active: "bg-theme-status-pending-bg text-theme-status-pending-text border border-theme-status-pending-text/20",
        inactive: "bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong"
      };
    case 'complete':
      return {
        active: "bg-theme-status-confirmed-bg text-theme-status-confirmed-text border border-theme-status-confirmed-text/20",
        inactive: "bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong"
      };
    case 'cancelled':
      return {
        active: "bg-theme-status-cancelled-bg text-theme-status-cancelled-text border border-theme-status-cancelled-text/20",
        inactive: "bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong"
      };
    default:
      return {
        active: "bg-theme-status-draft-bg text-theme-status-draft-text border border-theme-status-draft-text/20",
        inactive: "bg-transparent border border-theme-border-subtle text-theme-text-tertiary hover:text-theme-text-secondary hover:border-theme-border-strong"
      };
  }
}

interface AddTimelineBlockFormProps {
  eventId: string;
}

export function AddTimelineBlockForm({ eventId }: AddTimelineBlockFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [precision, setPrecision] = useState<TimePrecision>('30min');
  
  // Get date parameter from URL if present
  const dateParam = searchParams.get('date');
  
  // Calculate default times based on precision and date parameter
  const getDefaultTimes = (precision: TimePrecision, dateOverride?: string) => {
    console.log('Generating new default times based on current time or date parameter', { dateOverride });
    
    // Start with current date and time
    const now = new Date();
    
    // If date parameter exists, use it instead of current date
    if (dateOverride) {
      try {
        // Create a date object from YYYY-MM-DD format
        // Add time component (T00:00:00) to ensure proper parsing
        const dateObj = new Date(`${dateOverride}T00:00:00`);
        
        // Only proceed if we have a valid date
        if (!isNaN(dateObj.getTime())) {
          // Copy just the date part (year, month, day)
          now.setFullYear(dateObj.getFullYear());
          now.setMonth(dateObj.getMonth());
          now.setDate(dateObj.getDate());
          
          // Start at 9:00 AM for predefined dates instead of current time
          now.setHours(9, 0, 0, 0);
        }
      } catch (e) {
        console.error("Error parsing date parameter:", e);
      }
    }
    
    const roundedNow = roundToTimeInterval(now, precision);
    const intervalLater = new Date(roundedNow);
    
    // Add interval based on precision
    if (precision === '15min') {
      intervalLater.setMinutes(roundedNow.getMinutes() + 15);
    } else {
      intervalLater.setMinutes(roundedNow.getMinutes() + 30);
    }
    
    const result = {
      start: formatDateTimeForInput(roundedNow),
      end: formatDateTimeForInput(intervalLater)
    };
    
    console.log('Generated default times:', result);
    
    return result;
  };

  const defaultTimes = getDefaultTimes(precision, dateParam || undefined);
  
  // Form with zod validation
  const form = useForm<TimelineBlockFormValues>({
    resolver: zodResolver(precision === '15min' ? timelineBlockSchema15Min : timelineBlockSchema),
    defaultValues: {
      eventId: eventId,
      title: '',
      startTime: defaultTimes.start,
      endTime: defaultTimes.end,
      location: '',
      description: '',
      status: 'pending' as const,
      personnel: '',
      equipment: '',
      notes: '',
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
      
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sanitizedValues),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create timeline block');
      }
      
      // Use setTimeout to delay navigation slightly, avoiding hydration issues
      setTimeout(() => {
        router.push(`/en/events/${eventId}/timeline`);
        router.refresh();
      }, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
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
          <label htmlFor="title" className="text-[13px] font-medium text-theme-text-secondary">
            Title
          </label>
          <input
            id="title"
            type="text"
            {...form.register('title')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px]"
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
            <label className="text-[13px] font-medium text-theme-text-secondary">Time</label>
            
            {/* Linear-style precision toggle with improved disclosure */}
            <div className="relative group">
              <button
                type="button"
                onClick={() => setPrecision(precision === '30min' ? '15min' : '30min')}
                className="inline-flex items-center text-[12px] text-theme-text-secondary bg-theme-bg-input rounded-md px-2 py-1 border border-theme-border-subtle hover:border-theme-border-strong transition-colors duration-120"
              >
                <span>{precision === '15min' ? '15-min' : '30-min'}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 opacity-70">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              {/* Tooltip */}
              <div className="absolute right-0 mt-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity duration-150 w-48 p-2 bg-theme-bg-card border border-theme-border-subtle rounded-md shadow-lg text-[12px] text-theme-text-secondary">
                {precision === '15min' 
                  ? 'Using 15-minute intervals for more precise scheduling' 
                  : 'Using 30-minute intervals (standard)'}
              </div>
            </div>
          </div>
          
          {/* Time interval fields */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Start Time */}
            <div className="w-full">
              <label htmlFor="startTime" className="text-[13px] text-theme-text-tertiary mb-1 block">
                Start Time
              </label>
              <div className="relative">
                <input
                  id="startTime"
                  type="datetime-local"
                  {...form.register('startTime')}
                  className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary text-[14px] placeholder-theme-text-tertiary transition-colors duration-120"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-theme-text-tertiary pointer-events-none">
                  <span className="opacity-60">{precision === '15min' ? '(15m)' : '(30m)'}</span>
                </div>
              </div>
              {form.formState.errors.startTime && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.startTime.message}</p>
              )}
            </div>
            
            {/* End Time */}
            <div className="w-full">
              <label htmlFor="endTime" className="text-[13px] text-theme-text-tertiary mb-1 block">
                End Time
              </label>
              <div className="relative">
                <input
                  id="endTime"
                  type="datetime-local"
                  {...form.register('endTime')}
                  className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary text-[14px] placeholder-theme-text-tertiary transition-colors duration-120"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[12px] text-theme-text-tertiary pointer-events-none">
                  <span className="opacity-60">{precision === '15min' ? '(15m)' : '(30m)'}</span>
                </div>
              </div>
              {form.formState.errors.endTime && (
                <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>
          
          {/* Time interval disclosure */}
          <div className="mt-2 flex items-center gap-1.5 text-[12px] text-theme-text-tertiary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span>Times align to {precision === '15min' ? '15-minute' : '30-minute'} intervals (XX:00, XX:{precision === '15min' ? '15, XX:30, XX:45' : '30'})</span>
          </div>
        </div>
        
        {/* Location field */}
        <div className="space-y-2">
          <label htmlFor="location" className="text-[13px] font-medium text-theme-text-secondary flex items-center gap-1.5">
            Location <span className="font-normal text-theme-text-tertiary">(Optional)</span>
          </label>
          <input
            id="location"
            type="text"
            {...form.register('location')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px]"
            placeholder="Enter specific location (if different from event location)"
          />
        </div>
        
        {/* Personnel field */}
        <div className="space-y-2">
          <label htmlFor="personnel" className="text-[13px] font-medium text-theme-text-secondary flex items-center gap-1.5">
            Personnel <span className="font-normal text-theme-text-tertiary">(Optional)</span>
          </label>
          <input
            id="personnel"
            type="text"
            {...form.register('personnel')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px]"
            placeholder="Enter personnel responsible for this block"
          />
        </div>
        
        {/* Equipment field */}
        <div className="space-y-2">
          <label htmlFor="equipment" className="text-[13px] font-medium text-theme-text-secondary flex items-center gap-1.5">
            Equipment <span className="font-normal text-theme-text-tertiary">(Optional)</span>
          </label>
          <input
            id="equipment"
            type="text"
            {...form.register('equipment')}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px]"
            placeholder="Enter equipment needed for this block"
          />
        </div>
        
        {/* Status selection */}
        <div className="space-y-2">
          <span className="text-[13px] font-medium text-theme-text-secondary block">
            Status
          </span>
          <div className="flex flex-wrap gap-2">
            {(['pending', 'in-progress', 'complete', 'cancelled'] as const).map((statusOption) => {
              const styles = getStatusStyles(statusOption);
              return (
                <button
                  key={statusOption}
                  type="button"
                  onClick={() => form.setValue('status', statusOption)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-colors duration-150 ${
                    form.watch('status') === statusOption ? styles.active : styles.inactive
                  }`}
                >
                  {statusOption
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')}
                </button>
              );
            })}
          </div>
        </div>
        
        {/* Description/Notes field */}
        <div className="space-y-2">
          <label htmlFor="description" className="text-[13px] font-medium text-theme-text-secondary">
            Description
          </label>
          <textarea
            id="description"
            {...form.register('description')}
            rows={4}
            className="w-full px-3 py-2 bg-theme-bg-input border border-theme-border-subtle rounded-md focus:outline-none focus:ring-1 focus:ring-theme-primary focus:border-theme-primary placeholder:text-theme-text-tertiary transition-colors duration-120 text-[14px]"
            placeholder="Enter detailed instructions or notes"
          ></textarea>
        </div>
        
        {/* Submit button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className={`px-4 py-2 rounded-md text-white font-medium transition-colors duration-150 ${
              isLoading 
                ? 'bg-theme-primary/70 cursor-not-allowed' 
                : 'bg-theme-primary hover:bg-theme-primary-hover'
            }`}
          >
            {isLoading ? 'Creating...' : 'Create Block'}
          </button>
        </div>
      </form>
    </div>
  );
} 