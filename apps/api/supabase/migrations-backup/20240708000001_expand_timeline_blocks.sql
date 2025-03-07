-- Expand timeline_blocks table with additional fields for MVP needs
ALTER TABLE timeline_blocks 
  -- Who is responsible for this timeline block
  ADD COLUMN personnel TEXT,
  
  -- What equipment/resources are needed
  ADD COLUMN equipment TEXT,
  
  -- Additional notes/context for the block
  ADD COLUMN notes TEXT;

-- Add comments for documentation
COMMENT ON COLUMN timeline_blocks.personnel IS 'Person or team responsible for this timeline block';
COMMENT ON COLUMN timeline_blocks.equipment IS 'Equipment or resources needed for this timeline block';
COMMENT ON COLUMN timeline_blocks.notes IS 'Additional notes or context for this timeline block'; 