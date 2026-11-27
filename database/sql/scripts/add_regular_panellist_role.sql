-- Regular Panellist: for panel shows without captains, where the same
-- panellists appear in most episodes (Mock the Week, for example).
ALTER TYPE public.cast_role_type ADD VALUE IF NOT EXISTS 'RegularPanellist';
