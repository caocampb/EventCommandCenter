"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { createEventSchema, EventFormValues } from "@/lib/validations/event-schema";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

// Format date to ISO string - handles browser timezone differences consistently
function formatDateForInput(date: Date): string {
  // Format to YYYY-MM-DDThh:mm which works with datetime-local
  return date.toISOString().slice(0, 16);
}

// Format date for API submission
function formatDateForAPI(dateString: string): string {
  // Ensure the date is in proper ISO format for the API
  const date = new Date(dateString);
  return date.toISOString();
}

export function CreateEventForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default dates properly formatted for datetime-local input
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // React Hook Form with Zod validation
  const form = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: "",
      startDate: formatDateForInput(now),
      endDate: formatDateForInput(tomorrow),
      location: "",
      status: "draft",
      attendeeCount: 0,
      description: "",
    },
  });

  // Handle API errors consistently
  const handleApiError = useCallback(async (response: Response) => {
    // First try to parse as JSON
    try {
      const data = await response.json();
      // If we have a structured error message, use it
      if (data.error) {
        throw new Error(data.error);
      }
      // Otherwise fall back to status text
      throw new Error(response.statusText || "An error occurred");
    } catch (e) {
      // If JSON parsing fails, use status text or a generic message
      if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
        throw e;
      }
      throw new Error(response.statusText || "An error occurred");
    }
  }, []);

  async function onSubmit(values: EventFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Format dates properly for API submission
      const apiValues = {
        ...values,
        startDate: formatDateForAPI(values.startDate),
        endDate: formatDateForAPI(values.endDate),
      };

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(apiValues),
      });

      if (!response.ok) {
        await handleApiError(response);
      }

      const data = await response.json();
      
      // Redirect to the events list
      router.push("/events");
      router.refresh();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      
      // If it's an authentication error, we might want to redirect to login
      if (err instanceof Error && 
          (err.message === "Unauthorized access" || err.message.includes("auth"))) {
        // Optionally redirect to login page
        // router.push("/login");
      }
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Error display */}
        {error && (
          <div className="bg-red-500/5 border border-red-500/20 text-red-500 px-4 py-3 rounded-md mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Name field */}
        <div className="space-y-2">
          <label htmlFor="name" className="text-[13px] font-medium text-gray-400">
            Event Name
          </label>
          <input
            id="name"
            type="text"
            {...form.register("name")}
            className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-200 text-[14px]"
            placeholder="Enter event name"
            autoFocus
          />
          {form.formState.errors.name && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.name.message}</p>
          )}
        </div>

        {/* Date fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="startDate" className="text-[13px] font-medium text-gray-400">
              Start Date
            </label>
            <input
              id="startDate"
              type="datetime-local"
              {...form.register("startDate")}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-200 text-[14px] font-mono"
            />
            {form.formState.errors.startDate && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.startDate.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="endDate" className="text-[13px] font-medium text-gray-400">
              End Date
            </label>
            <input
              id="endDate"
              type="datetime-local"
              {...form.register("endDate")}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] transition-colors duration-200 text-[14px] font-mono"
            />
            {form.formState.errors.endDate && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.endDate.message}</p>
            )}
          </div>
        </div>

        {/* Location field */}
        <div className="space-y-2">
          <label htmlFor="location" className="text-[13px] font-medium text-gray-400">
            Location
          </label>
          <input
            id="location"
            type="text"
            {...form.register("location")}
            className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-200 text-[14px]"
            placeholder="Enter event location"
          />
          {form.formState.errors.location && (
            <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.location.message}</p>
          )}
        </div>

        {/* Event details section with heading */}
        <div className="pt-4 pb-2">
          <div className="border-t border-[#262626] mb-6"></div>
          <h3 className="text-[13px] font-medium uppercase tracking-wider text-gray-400 mb-6">
            Event Details
          </h3>
          
          {/* Attendee count field */}
          <div className="space-y-2 mb-6">
            <label htmlFor="attendeeCount" className="text-[13px] font-medium text-gray-400">
              Expected Attendees
            </label>
            <input
              id="attendeeCount"
              type="number"
              {...form.register("attendeeCount", { valueAsNumber: true })}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-200 text-[14px]"
              placeholder="0"
              min="1"
            />
            {form.formState.errors.attendeeCount && (
              <p className="text-red-500 text-[13px] mt-1.5">{form.formState.errors.attendeeCount.message}</p>
            )}
          </div>

          {/* Description field */}
          <div className="space-y-2">
            <label htmlFor="description" className="text-[13px] font-medium text-gray-400">
              Description <span className="text-gray-600">(Optional)</span>
            </label>
            <textarea
              id="description"
              {...form.register("description")}
              className="w-full px-3 py-2 bg-[#141414] border border-[#262626] rounded-md focus:outline-none focus:ring-1 focus:ring-[#5E6AD2] focus:border-[#5E6AD2] placeholder:text-gray-600 transition-colors duration-200 min-h-[100px] resize-y text-[14px] leading-relaxed"
              placeholder="Enter event description"
            />
          </div>
        </div>

        {/* Submit button with improved connection to form */}
        <div className="flex justify-end border-t border-[#262626] pt-6 mt-2">
          <button
            type="submit"
            disabled={isLoading}
            className="px-4 py-2 bg-[#5E6AD2] hover:bg-[#6872E5] text-white rounded-md transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed text-[14px] font-medium border border-transparent hover:border-[#8D95F2] shadow-sm hover:shadow"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating...
              </span>
            ) : "Create Event"}
          </button>
        </div>
      </form>
    </div>
  );
} 