import { Document, Page, Text, View, StyleSheet, pdf, Line, Svg, Circle, Path } from '@react-pdf/renderer';
import type { TimelineBlock } from '../types/timeline';

// Refined Linear-inspired styles with precise typography and spacing
const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: 'Helvetica',
    backgroundColor: '#FFFFFF',
    color: '#111111',
  },
  header: {
    marginBottom: 36,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EBEBEB',
    borderBottomStyle: 'solid',
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000000',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 13,
    color: '#454545',
    marginBottom: 1.5,
    lineHeight: 1.4,
  },
  dayHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 24,
    marginBottom: 20,
    color: '#000000',
    letterSpacing: -0.2,
    paddingBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F4F4F4',
  },
  timeline: {
    marginBottom: 32,
  },
  blockRow: {
    flexDirection: 'row',
    marginBottom: 24,
    position: 'relative',
  },
  timeColumn: {
    width: 72,
    paddingRight: 12,
  },
  timeText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: '#333333',
    marginBottom: 2,
  },
  timeEndText: {
    fontSize: 11,
    fontFamily: 'Courier',
    color: '#777777',
  },
  timeConnector: {
    position: 'absolute',
    left: 72,
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: '#ECECEC',
  },
  contentColumn: {
    flex: 1,
    borderLeftWidth: 0, // Remove original border
    paddingLeft: 20,
    position: 'relative',
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    left: -4,
    top: 3,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000000',
    letterSpacing: -0.1,
  },
  blockMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
    alignItems: 'center',
  },
  statusPill: {
    fontSize: 9,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  metaDivider: {
    fontSize: 10,
    color: '#BBBBBB',
    marginHorizontal: 6,
  },
  locationText: {
    fontSize: 10,
    color: '#555555',
  },
  row: {
    flexDirection: 'row',
    marginTop: 6,
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 9.5,
    color: '#777777',
    width: 70,
  },
  metaText: {
    fontSize: 10,
    color: '#454545',
    flex: 1,
  },
  detailsSection: {
    marginTop: 10,
    backgroundColor: '#FAFAFA',
    padding: 10,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#EEEEEE',
  },
  detailLabel: {
    fontSize: 9,
    color: '#666666',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  detailText: {
    fontSize: 10,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 1.4,
  },
  noBlocks: {
    fontSize: 14,
    color: '#666666',
    marginTop: 30,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 48,
    right: 48,
    textAlign: 'center',
    color: '#999999',
    fontSize: 9,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: '#EAEAEA',
  },
  statusIndicator: {
    position: 'absolute',
    left: -14,
    top: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusInnerCircle: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },
  checkmarkPath: {
    stroke: '#FFFFFF',
    strokeWidth: 1.5,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  },
  timelineSection: {
    marginBottom: 40,
  },
  timelineSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginBottom: 8,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#EEEEEE',
  },
  statusSummaryText: {
    fontSize: 10,
    color: '#777777',
    marginRight: 8,
  },
  statusCounter: {
    fontSize: 10,
    color: '#555555',
    fontWeight: 'bold',
    marginRight: 16,
  },
  timeMarkerContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 72,
    pointerEvents: 'none',
  },
  timeMarker: {
    position: 'absolute',
    left: 0,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeMarkerLine: {
    width: 4,
    height: 1,
    backgroundColor: '#DDDDDD',
    marginRight: 4,
  },
  timeMarkerText: {
    fontSize: 9,
    color: '#999999',
    fontFamily: 'Courier',
  },
  hourDivider: {
    backgroundColor: '#F5F5F5',
    padding: 8,
    marginBottom: 16,
    marginTop: 24,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#DDDDDD',
    borderLeftStyle: 'solid',
  },
  hourDividerText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555555',
    fontFamily: 'Courier',
  },
  blockContainer: {
    marginLeft: 24,
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
    borderLeftStyle: 'solid',
    paddingLeft: 16,
    marginBottom: 16,
  }
});

// Add this utility function to extract time components from timestamp strings
const extractTimeComponents = (timeString: string): { hours: number, minutes: number } => {
  try {
    // Get the HH:MM part directly from the string for consistent timezone handling
    const timeMatch = timeString.match(/T(\d{2}):(\d{2})/);
    if (timeMatch && timeMatch.length >= 3) {
      const hourStr = timeMatch[1];
      const minuteStr = timeMatch[2];
      
      if (hourStr && minuteStr) {
        return {
          hours: parseInt(hourStr, 10),
          minutes: parseInt(minuteStr, 10)
        };
      }
    }
    
    // Fallback to Date object if needed
    const date = new Date(timeString);
    return {
      hours: date.getHours(),
      minutes: date.getMinutes()
    };
  } catch (e) {
    console.warn('Time extraction error:', e);
    return { hours: 0, minutes: 0 };
  }
};

// Shared positioning function to ensure perfect alignment
const calculateTimePosition = (
  timeString: string, 
  startHour: number, 
  pixelsPerHour: number = 100
): number => {
  const { hours, minutes } = extractTimeComponents(timeString);
  const timeDecimal = hours + (minutes / 60);
  return (timeDecimal - startHour) * pixelsPerHour;
};

// Format a time string from ISO format to a clean, readable format
const formatTimeDisplay = (timeString: string): string => {
  const { hours, minutes } = extractTimeComponents(timeString);
  
  // Format with clean AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const displayMinutes = minutes.toString().padStart(2, '0');
  
  return `${displayHours}:${displayMinutes} ${period}`;
};

// Simple date extraction from ISO format to YYYY-MM-DD
const getDatePart = (dateString: string): string => {
  try {
    if (dateString.includes('T')) {
      const parts = dateString.split('T');
      return parts[0] || dateString;
    }
    return dateString;
  } catch (e) {
    return dateString;
  }
};

// Format date for display
const formatDateDisplay = (dateString: string): string => {
  try {
    const datePart = getDatePart(dateString);
    const parts = datePart.split('-');
    
    // Ensure we have all three parts
    if (parts.length !== 3) {
      return datePart;
    }
    
    const yearStr = parts[0];
    const monthStr = parts[1];
    const dayStr = parts[2];
    
    if (!yearStr || !monthStr || !dayStr) {
      return datePart;
    }
    
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const day = parseInt(dayStr, 10);
    
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    // Handle invalid dates gracefully
    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12) {
      return datePart;
    }
    
    return `${months[month - 1]} ${day}, ${year}`;
  } catch (e) {
    return dateString;
  }
};

// Clean status display
const formatStatus = (status: string = 'pending'): string => {
  return status
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Get status colors in a refined Linear palette
const getStatusInfo = (status: string = 'pending'): { color: string, bgColor: string } => {
  switch (status) {
    case 'complete':
      return { color: '#5A458E', bgColor: '#F7F6FB' };
    case 'in-progress':
      return { color: '#2D6CCA', bgColor: '#F5F8FD' };
    case 'confirmed':
      return { color: '#158F6B', bgColor: '#F4FBF9' };
    case 'cancelled':
      return { color: '#C63A2F', bgColor: '#FDF5F5' };
    default: // pending
      return { color: '#575757', bgColor: '#F8F8F8' };
  }
};

// Filter blocks by date and sort by time
const organizeBlocksByDate = (blocks: TimelineBlock[], startDate: string, endDate: string) => {
  // Group blocks by date
  const blocksByDate: Record<string, TimelineBlock[]> = {};
  
  // Filter blocks to only include those within the date range
  blocks.forEach(block => {
    if (!block || !block.startTime) return;
    
    const blockDate = getDatePart(block.startTime.toString());
    const eventStartDate = getDatePart(startDate);
    const eventEndDate = getDatePart(endDate);
    
    // Check if block date is within event date range
    if (blockDate >= eventStartDate && blockDate <= eventEndDate) {
      if (!blocksByDate[blockDate]) {
        blocksByDate[blockDate] = [];
      }
      blocksByDate[blockDate].push(block);
    }
  });
  
  // Sort blocks within each day by start time
  Object.keys(blocksByDate).forEach(date => {
    const dayBlocks = blocksByDate[date];
    if (dayBlocks) {
      dayBlocks.sort((a, b) => {
        if (!a.startTime || !b.startTime) return 0;
        const aTime = new Date(a.startTime.toString()).getTime();
        const bTime = new Date(b.startTime.toString()).getTime();
        return aTime - bTime;
      });
    }
  });
  
  // Return date entries sorted by date
  return Object.entries(blocksByDate).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
};

// Add a function to create a unified timeline layout
const createTimelineLayout = (blocks: TimelineBlock[]) => {
  // Default time range if no valid blocks
  const DEFAULT_MIN_HOUR = 8; // 8 AM
  const DEFAULT_MAX_HOUR = 18; // 6 PM
  
  // Find min and max hours from blocks
  let minHour = DEFAULT_MIN_HOUR;
  let maxHour = DEFAULT_MAX_HOUR;
  
  if (blocks && blocks.length > 0) {
    // Extract all time points from blocks
    const timePoints: {hours: number, minutes: number}[] = [];
    
    blocks.forEach(block => {
      if (block.startTime) {
        timePoints.push(extractTimeComponents(block.startTime.toString()));
      }
      if (block.endTime) {
        timePoints.push(extractTimeComponents(block.endTime.toString()));
      }
    });
    
    // Find min/max if we have time points
    if (timePoints.length > 0) {
      minHour = Math.min(...timePoints.map(t => t.hours));
      maxHour = Math.max(...timePoints.map(t => t.hours)) + 1; // Add 1 hour to max for padding
    }
  }
  
  // Generate hour markers
  const hourMarkers: number[] = [];
  for (let hour = minHour; hour <= maxHour; hour++) {
    hourMarkers.push(hour);
  }
  
  return {
    minHour,
    maxHour,
    hourMarkers,
    
    // Determine which hour "slot" an event belongs in
    getHourSlot: (timeString: string): number => {
      const { hours } = extractTimeComponents(timeString);
      return hours;
    }
  };
};

// Add a function to format hour markers
const formatHourForMarker = (hour: number): string => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}${period}`;
};

// TimelineBlockComponent simplified for pure chronological display
const TimelineBlockComponent = ({ 
  block
}: { 
  block: TimelineBlock; 
}) => {
  if (!block || !block.startTime || !block.endTime) return null;
  
  const statusInfo = getStatusInfo(block.status as string);
  const isComplete = block.status === 'complete';
  const isInProgress = block.status === 'in-progress';
  
  return (
    <View style={styles.blockContainer}>
      {/* Time and content in a simple row */}
      <View style={styles.blockRow}>
        {/* Time column */}
        <View style={styles.timeColumn}>
          <Text style={styles.timeText}>
            {formatTimeDisplay(block.startTime.toString())}
          </Text>
          <Text style={styles.timeEndText}>
            {formatTimeDisplay(block.endTime.toString())}
          </Text>
        </View>
        
        {/* Content column */}
        <View style={styles.contentColumn}>
          {/* Status indicator dot */}
          <View style={[styles.statusIndicator, { backgroundColor: statusInfo.color }]}>
            {isComplete && (
              <Svg width="12" height="12" viewBox="0 0 12 12">
                <Path d="M3.5 6L5 7.5L8.5 4" style={styles.checkmarkPath} />
              </Svg>
            )}
            {isInProgress && (
              <View style={styles.statusInnerCircle} />
            )}
          </View>
          
          {/* Block title */}
          <Text style={styles.blockTitle}>{block.title}</Text>
          
          {/* Status and location on same line */}
          <View style={styles.blockMeta}>
            <Text style={[
              styles.statusPill, 
              { backgroundColor: statusInfo.bgColor, color: statusInfo.color }
            ]}>
              {formatStatus(block.status as string)}
            </Text>
            
            {block.location && (
              <>
                <Text style={styles.metaDivider}>•</Text>
                <Text style={styles.locationText}>{block.location}</Text>
              </>
            )}
          </View>
          
          {/* Personnel row */}
          {block.personnel && (
            <View style={styles.row}>
              <Text style={styles.metaLabel}>Personnel:</Text>
              <Text style={styles.metaText}>{block.personnel}</Text>
            </View>
          )}
          
          {/* Equipment row */}
          {block.equipment && (
            <View style={styles.row}>
              <Text style={styles.metaLabel}>Equipment:</Text>
              <Text style={styles.metaText}>{block.equipment}</Text>
            </View>
          )}
          
          {/* Description and notes */}
          {(block.description || block.notes) && (
            <View style={styles.detailsSection}>
              {block.description && (
                <View>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailText}>{block.description}</Text>
                </View>
              )}
              
              {block.notes && (
                <View>
                  <Text style={styles.detailLabel}>Notes</Text>
                  <Text style={styles.detailText}>{block.notes}</Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Add a function to count blocks by status
const countBlocksByStatus = (blocks: TimelineBlock[]) => {
  const total = blocks.length;
  const complete = blocks.filter(block => block.status === 'complete').length;
  const inProgress = blocks.filter(block => block.status === 'in-progress').length;
  const pending = total - complete - inProgress;
  
  return {
    total,
    complete,
    inProgress,
    pending
  };
};

// Updated PDF Document Component with pure chronological display
const RunOfShowDocument = ({
  eventName,
  eventLocation,
  eventDate,
  eventEndDate,
  blocks
}: {
  eventName: string;
  eventLocation: string;
  eventDate: string;
  eventEndDate: string;
  blocks: TimelineBlock[];
}) => {
  // Organize blocks by date
  const blocksByDate = organizeBlocksByDate(blocks, eventDate, eventEndDate);
  
  // Format date range for display
  const startFormatted = formatDateDisplay(eventDate);
  const endFormatted = eventDate === eventEndDate ? '' : formatDateDisplay(eventEndDate);
  const dateDisplay = endFormatted ? `${startFormatted} - ${endFormatted}` : startFormatted;
  
  return (
    <Document title={`${eventName} - Run of Show`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{eventName}</Text>
          <Text style={styles.subtitle}>Run of Show</Text>
          {eventLocation && <Text style={styles.subtitle}>Location: {eventLocation}</Text>}
          <Text style={styles.subtitle}>Date: {dateDisplay}</Text>
        </View>
        
        {/* Content */}
        {blocksByDate.length === 0 ? (
          <Text style={styles.noBlocks}>No timeline blocks found for this event's date range.</Text>
        ) : (
          blocksByDate.map(([date, dayBlocks]) => {
            // Calculate status counts for the day
            const statusCounts = countBlocksByStatus(dayBlocks);
            
            // Group blocks by hour for displaying hour dividers
            const blocksByHour: Record<number, TimelineBlock[]> = {};
            
            // Create a map to track which hours we need dividers for
            dayBlocks.forEach(block => {
              if (!block.startTime) return;
              const { hours } = extractTimeComponents(block.startTime.toString());
              if (!blocksByHour[hours]) {
                blocksByHour[hours] = [];
              }
              blocksByHour[hours].push(block);
            });
            
            // Sort blocks chronologically regardless of hour
            dayBlocks.sort((a, b) => {
              if (!a.startTime || !b.startTime) return 0;
              return new Date(a.startTime.toString()).getTime() - new Date(b.startTime.toString()).getTime();
            });
            
            return (
              <View key={date} wrap={false} style={styles.timelineSection}>
                {/* Day header */}
                <Text style={styles.dayHeader}>{formatDateDisplay(date)}</Text>
                
                {/* Status summary for the day */}
                <View style={styles.timelineSummary}>
                  <Text style={styles.statusSummaryText}>Status:</Text>
                  <Text style={styles.statusCounter}>
                    {statusCounts.complete} complete
                  </Text>
                  <Text style={styles.statusCounter}>
                    {statusCounts.inProgress} in progress
                  </Text>
                  <Text style={styles.statusCounter}>
                    {statusCounts.pending} pending
                  </Text>
                </View>
                
                {/* All blocks in chronological order with hour dividers */}
                <View style={styles.timeline}>
                  {/* Iterate through each block, adding hour dividers when the hour changes */}
                  {dayBlocks.reduce((elements, block, index) => {
                    if (!block.startTime) return elements;
                    
                    const { hours } = extractTimeComponents(block.startTime.toString());
                    
                    // Check if this is the first block or if hour has changed from previous block
                    const prevStartTime = dayBlocks[index-1]?.startTime;
                    const isNewHour = index === 0 || 
                      (prevStartTime && 
                       extractTimeComponents(prevStartTime.toString()).hours !== hours);
                    
                    if (isNewHour) {
                      // Add hour divider
                      elements.push(
                        <View key={`hour-${hours}`} style={styles.hourDivider}>
                          <Text style={styles.hourDividerText}>
                            {formatHourForMarker(hours)}
                          </Text>
                        </View>
                      );
                    }
                    
                    // Add the block
                    elements.push(
                      <TimelineBlockComponent 
                        key={block.id.toString()} 
                        block={block}
                      />
                    );
                    
                    return elements;
                  }, [] as React.ReactNode[])}
                </View>
              </View>
            );
          })
        )}
        
        {/* Footer with page numbering */}
        <View style={styles.footer} fixed>
          <Text render={({ pageNumber, totalPages }) => 
            `Page ${pageNumber} of ${totalPages} • Generated on ${new Date().toLocaleDateString()} • Event Command Center`
          } />
        </View>
      </Page>
    </Document>
  );
};

// Main function to generate and download the PDF
export async function generateRunOfShowPDF(
  eventName: string,
  eventLocation: string,
  eventDate: string,
  blocks: TimelineBlock[],
  eventEndDate: string = eventDate
): Promise<boolean> {
  try {
    // Create the PDF document
    const doc = (
      <RunOfShowDocument
        eventName={eventName}
        eventLocation={eventLocation}
        eventDate={eventDate}
        eventEndDate={eventEndDate}
        blocks={blocks}
      />
    );
    
    // Generate PDF blob
    const asPdf = pdf();
    asPdf.updateContainer(doc);
    const blob = await asPdf.toBlob();
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    // Clean filename
    const cleanName = eventName.replace(/\s+/g, '-').toLowerCase();
    const dateStr = new Date().toISOString().split('T')[0];
    
    link.href = url;
    link.download = `${cleanName}-run-of-show-${dateStr}.pdf`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
} 