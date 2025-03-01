'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Validation schema for the participant form
const participantSchema = z.object({
  name: z.string().min(2, "Name is required"),
  email: z.string().email("Please enter a valid email"),
  organization: z.string().optional(),
  role: z.string().optional(),
  dietaryRequirements: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  notes: z.string().optional(),
});

type ParticipantFormValues = z.infer<typeof participantSchema>;

interface AddParticipantModalProps {
  eventId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddParticipantModal({ 
  eventId, 
  isOpen, 
  onClose, 
  onSuccess 
}: AddParticipantModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize form with React Hook Form + Zod validation
  const form = useForm<ParticipantFormValues>({
    resolver: zodResolver(participantSchema),
    defaultValues: {
      name: '',
      email: '',
      organization: '',
      role: '',
      dietaryRequirements: '',
      accessibilityNeeds: '',
      notes: '',
    }
  });
  
  // Form submission handler
  const onSubmit = async (data: ParticipantFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Create a new participant and associate with event
      const response = await fetch(`/api/events/${eventId}/participants`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add participant');
      }
      
      // Reset form and close modal on success
      form.reset();
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error adding participant:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If modal is closed, don't render anything
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div 
        className="bg-[#141414] border border-[#1F1F1F] rounded-md w-full max-w-md shadow-xl animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1F1F1F] p-4">
          <h2 className="text-[15px] font-medium">Add Participant</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors duration-150"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-4">
          {/* Error message */}
          {error && (
            <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-3 py-2 rounded-md text-[13px]">
              {error}
            </div>
          )}
          
          {/* Essential fields - always visible */}
          <div className="space-y-4">
            {/* Name field */}
            <div className="space-y-1">
              <label htmlFor="name" className="text-[13px] font-medium text-gray-400">
                Name
              </label>
              <input
                id="name"
                type="text"
                {...form.register('name')}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter participant name"
                autoFocus
              />
              {form.formState.errors.name && (
                <p className="text-red-500 text-[13px] mt-1">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            
            {/* Email field */}
            <div className="space-y-1">
              <label htmlFor="email" className="text-[13px] font-medium text-gray-400">
                Email
              </label>
              <input
                id="email"
                type="email"
                {...form.register('email')}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter participant email"
              />
              {form.formState.errors.email && (
                <p className="text-red-500 text-[13px] mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            
            {/* Organization field - Visible but optional */}
            <div className="space-y-1">
              <label htmlFor="organization" className="text-[13px] font-medium text-gray-400">
                Organization <span className="text-gray-600">(Optional)</span>
              </label>
              <input
                id="organization"
                type="text"
                {...form.register('organization')}
                className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                placeholder="Enter organization name"
              />
            </div>
          </div>
          
          {/* Advanced fields - Progressive disclosure */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-[13px] text-gray-400 hover:text-white transition-colors duration-150 flex items-center gap-1"
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
                className={`transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              {showAdvanced ? 'Hide details' : 'Add details'}
            </button>
            
            {showAdvanced && (
              <div className="mt-4 space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-200">
                {/* Role field */}
                <div className="space-y-1">
                  <label htmlFor="role" className="text-[13px] font-medium text-gray-400">
                    Role <span className="text-gray-600">(Optional)</span>
                  </label>
                  <input
                    id="role"
                    type="text"
                    {...form.register('role')}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                    placeholder="Enter participant role"
                  />
                </div>
                
                {/* Dietary Requirements field */}
                <div className="space-y-1">
                  <label htmlFor="dietaryRequirements" className="text-[13px] font-medium text-gray-400">
                    Dietary Requirements <span className="text-gray-600">(Optional)</span>
                  </label>
                  <input
                    id="dietaryRequirements"
                    type="text"
                    {...form.register('dietaryRequirements')}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                    placeholder="Any dietary restrictions or preferences"
                  />
                </div>
                
                {/* Accessibility Needs field */}
                <div className="space-y-1">
                  <label htmlFor="accessibilityNeeds" className="text-[13px] font-medium text-gray-400">
                    Accessibility Needs <span className="text-gray-600">(Optional)</span>
                  </label>
                  <input
                    id="accessibilityNeeds"
                    type="text"
                    {...form.register('accessibilityNeeds')}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px]"
                    placeholder="Any accessibility requirements"
                  />
                </div>
                
                {/* Notes field */}
                <div className="space-y-1">
                  <label htmlFor="notes" className="text-[13px] font-medium text-gray-400">
                    Notes <span className="text-gray-600">(Optional)</span>
                  </label>
                  <textarea
                    id="notes"
                    {...form.register('notes')}
                    className="w-full px-3 py-2 bg-[#141414] border border-[#1F1F1F] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-120 text-[14px] min-h-[80px] resize-y"
                    placeholder="Additional notes about this participant"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Footer with actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-[#1F1F1F] mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-[#1E1E1E] hover:bg-[#2A2A2A] text-sm text-gray-300 hover:text-white font-medium rounded transition-colors duration-120 border border-[#333333] hover:border-[#444444]"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-3 py-1.5 bg-[#5E6AD2] hover:bg-[#6872E5] text-white text-sm font-medium rounded transition-colors duration-120 border border-transparent hover:border-[#8D95F2] shadow-[0_1px_2px_rgba(0,0,0,0.05)] hover:shadow-[0_3px_12px_rgba(94,106,210,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <svg className="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </span>
              ) : 'Add Participant'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 