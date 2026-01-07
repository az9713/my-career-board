-- PCGS Initial Schema
-- Personal Career Governance System

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{"llm_provider": "anthropic", "notifications_enabled": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Problem Portfolio
CREATE TABLE problems (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  what_breaks TEXT NOT NULL,
  scarcity_signals TEXT[] NOT NULL DEFAULT '{}',
  ai_cheaper TEXT,
  error_cost TEXT,
  trust_required TEXT,
  classification TEXT NOT NULL CHECK (classification IN ('appreciating', 'depreciating', 'stable', 'stable_uncertain')),
  classification_reasoning TEXT,
  time_allocation INTEGER CHECK (time_allocation >= 0 AND time_allocation <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board Roles (generated from portfolio)
CREATE TABLE board_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('accountability', 'market_reality', 'avoidance', 'strategist', 'devils_advocate')),
  anchored_problem_id UUID REFERENCES problems(id) ON DELETE SET NULL,
  focus_area TEXT NOT NULL,
  system_prompt TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Board Sessions
CREATE TABLE board_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('quick_audit', 'quarterly')),
  quarter TEXT, -- e.g., 'Q1 2026'
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_phase INTEGER DEFAULT 1,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Session Messages (transcript)
CREATE TABLE session_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL, -- 'user' | 'accountability' | 'market_reality' | 'avoidance' | 'strategist' | 'devils_advocate' | 'system'
  content TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('question', 'response', 'challenge', 'interjection', 'system')),
  metadata JSONB, -- For storing gate results, receipts, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quarterly Reports (structured output)
CREATE TABLE quarterly_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES board_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  quarter TEXT NOT NULL,

  -- Last bet review
  last_bet TEXT,
  last_bet_wrong_if TEXT,
  last_bet_result TEXT CHECK (last_bet_result IN ('happened', 'didnt', 'partial')),
  last_bet_evidence TEXT,

  -- Commitments vs actuals
  commitments JSONB, -- Array of {commitment, receipts[], gap}

  -- Core fields
  avoided_decision TEXT NOT NULL,
  avoided_decision_why TEXT NOT NULL,
  avoided_decision_cost TEXT NOT NULL,
  comfort_work TEXT NOT NULL,
  comfort_work_avoided TEXT NOT NULL,

  -- Next bet
  next_bet TEXT NOT NULL,
  next_bet_wrong_if TEXT NOT NULL,

  -- Assessment
  overall_assessment TEXT,
  concerns TEXT[],
  action_items TEXT[],

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_problems_user_id ON problems(user_id);
CREATE INDEX idx_board_roles_user_id ON board_roles(user_id);
CREATE INDEX idx_board_sessions_user_id ON board_sessions(user_id);
CREATE INDEX idx_board_sessions_status ON board_sessions(status);
CREATE INDEX idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX idx_quarterly_reports_user_id ON quarterly_reports(user_id);

-- Row Level Security (RLS) Policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quarterly_reports ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can only access their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Problems: Users can only access their own problems
CREATE POLICY "Users can view own problems" ON problems
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own problems" ON problems
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own problems" ON problems
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own problems" ON problems
  FOR DELETE USING (auth.uid() = user_id);

-- Board Roles: Users can only access their own roles
CREATE POLICY "Users can view own board roles" ON board_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own board roles" ON board_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own board roles" ON board_roles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own board roles" ON board_roles
  FOR DELETE USING (auth.uid() = user_id);

-- Board Sessions: Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON board_sessions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sessions" ON board_sessions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sessions" ON board_sessions
  FOR UPDATE USING (auth.uid() = user_id);

-- Session Messages: Users can access messages from their sessions
CREATE POLICY "Users can view own session messages" ON session_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM board_sessions
      WHERE board_sessions.id = session_messages.session_id
      AND board_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own session messages" ON session_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM board_sessions
      WHERE board_sessions.id = session_messages.session_id
      AND board_sessions.user_id = auth.uid()
    )
  );

-- Quarterly Reports: Users can only access their own reports
CREATE POLICY "Users can view own reports" ON quarterly_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports" ON quarterly_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reports" ON quarterly_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_problems_updated_at
  BEFORE UPDATE ON problems
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
