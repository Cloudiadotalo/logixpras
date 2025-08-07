/*
  # Fix replica identity for logr table

  1. Problem
    - Table 'logr' cannot perform DELETE operations
    - Error: "cannot delete from table logr because it does not have a replica identity and publishes deletes"
    
  2. Solution
    - Set REPLICA IDENTITY FULL for the logr table
    - This allows the database to track all columns for delete operations
    
  3. Impact
    - Enables DELETE operations on the logr table
    - Allows the admin panel to delete leads properly
*/

-- Set replica identity to FULL for the logr table
-- This enables delete operations by tracking all columns
ALTER TABLE public.logr REPLICA IDENTITY FULL;