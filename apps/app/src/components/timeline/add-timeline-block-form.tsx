'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  timelineBlockSchema, 
  TimelineBlockFormValues, 
  roundToTimeInterval 
} from '../../lib/validations/timeline-block-schema';

interface AddTimelineBlockFormProps {
  eventId: string;
}

export function AddTimelineBlockForm({ eventId }: AddTimelineBlockFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set default time values - start is current time rounded to nearest 30 min, end is 30 min later
  const now = new Date();
  const roundedNow = roundToTimeInterval(now);
  const thirtyMinutesLater = new Date(roundedNow);
  thirtyMinutesLater.setMinutes(roundedNow.getMinutes() + 30);
  
  // Format date for datetime-local input
  const formatDateTimeForInput = (date: Date): string => {
    return date.toISOString().slice(0, 16); // Format: YYYY-MM-DDThh:mm
  };
  
  // Form with zod validation
  const form = useForm<TimelineBlockFormValues>({
    resolver: zodResolver(timelineBlockSchema),
    defaultValues: {
      eventId: eventId,
      title: '',
      startTime: formatDateTimeForInput(roundedNow),
      endTime: formatDateTimeForInput(thirtyMinutesLater),
      location: '',
      description: '',
      status: 'pending',
    },
  });
  
  // Handle form submission
  async function onSubmit(values: TimelineBlockFormValues) {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting timeline block:', values);
      
      const response = await fetch(`/api/events/${eventId}/timeline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error creating timeline block:', errorData);
        throw new Error(errorData.error || 'Failed to create timeline block');
      }
      
      // Redirect back to timeline view after successful creation
      router.push(`/events/${eventId}/timeline`);
      router.refresh();
    } catch (err) {
      console.error('Error creating timeline block:', err);
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
        
        {/* Time fields */}
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
        
        {/* Status field */}
        <div className="space-y-2">
          <label htmlFor="status" className="text-[13px] font-medium text-gray-400">
            Status
          </label>
          <select
            id="status"
            {...form.register('status')}
            className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-120 text-[14px]"
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="complete">Complete</option>
            <option value="cancelled">Cancelled</option>
          </select>
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
        
        {/* Submit button */}
        <div className="flex justify-end border-t border-[#1F1F1F] pt-6 mt-2">
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
                Creating...
              </span>
            ) : 'Add Timeline Block'}
          </button>
        </div>
      </form>
    </div>
  );
} 