-- ============================================================
-- RECRUITMENT SCREENING PLATFORM - DATABASE SCHEMA
-- ============================================================
-- Run this in Supabase SQL Editor to set up all tables
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- JOBS TABLE
-- Stores job postings created by recruiters
-- ============================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    requirements TEXT,
    required_skills TEXT[] DEFAULT '{}',
    preferred_skills TEXT[] DEFAULT '{}',
    experience_level TEXT CHECK (experience_level IN ('junior', 'mid', 'senior', 'lead', 'any')) DEFAULT 'any',
    min_years_experience INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CANDIDATES TABLE
-- Stores candidate information added by recruiters
-- ============================================================
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recruiter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_text TEXT,
    resume_file_url TEXT,
    parsed_skills JSONB DEFAULT '{}',
    parsed_experience JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- APPLICATIONS TABLE
-- Links candidates to jobs with unique interview codes
-- ============================================================
CREATE TABLE IF NOT EXISTS applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    interview_code TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'invited', 'started', 'completed', 'expired')) DEFAULT 'pending',
    invited_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, candidate_id)
);

-- ============================================================
-- INTERVIEWS TABLE
-- Stores completed interview sessions with results
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    transcript JSONB DEFAULT '[]',
    questions_asked JSONB DEFAULT '[]',
    overall_score NUMERIC(3,1) CHECK (overall_score >= 0 AND overall_score <= 10),
    technical_score NUMERIC(3,1) CHECK (technical_score >= 0 AND technical_score <= 10),
    communication_score NUMERIC(3,1) CHECK (communication_score >= 0 AND communication_score <= 10),
    cultural_fit_score NUMERIC(3,1) CHECK (cultural_fit_score >= 0 AND cultural_fit_score <= 10),
    strengths TEXT[],
    weaknesses TEXT[],
    ai_summary TEXT,
    ai_recommendation TEXT CHECK (ai_recommendation IN ('strong_yes', 'yes', 'maybe', 'no', 'strong_no')),
    duration_minutes INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- GENERATED QUESTIONS TABLE
-- Stores AI-generated questions for each interview
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    application_id UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT CHECK (question_type IN ('technical', 'behavioral', 'situational', 'project', 'skill')),
    skill_category TEXT,
    difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
    expected_answer TEXT,
    order_index INTEGER DEFAULT 0,
    was_asked BOOLEAN DEFAULT false,
    candidate_answer TEXT,
    answer_score NUMERIC(3,1),
    answer_feedback TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter ON jobs(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_recruiter ON candidates(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_candidates_email ON candidates(email);
CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(job_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate ON applications(candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_code ON applications(interview_code);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_interviews_application ON interviews(application_id);
CREATE INDEX IF NOT EXISTS idx_questions_application ON interview_questions(application_id);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- Jobs policies
CREATE POLICY "Recruiters can view their own jobs" ON jobs
    FOR SELECT USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert their own jobs" ON jobs
    FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own jobs" ON jobs
    FOR UPDATE USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own jobs" ON jobs
    FOR DELETE USING (auth.uid() = recruiter_id);

-- Candidates policies
CREATE POLICY "Recruiters can view their own candidates" ON candidates
    FOR SELECT USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can insert their own candidates" ON candidates
    FOR INSERT WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update their own candidates" ON candidates
    FOR UPDATE USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete their own candidates" ON candidates
    FOR DELETE USING (auth.uid() = recruiter_id);

-- Applications policies (recruiters via job ownership)
CREATE POLICY "Recruiters can view applications for their jobs" ON applications
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
    );

CREATE POLICY "Recruiters can insert applications for their jobs" ON applications
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.recruiter_id = auth.uid())
    );

CREATE POLICY "Recruiters can update applications for their jobs" ON applications
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = applications.job_id AND jobs.recruiter_id = auth.uid())
    );

-- Allow candidates to view their own application by code (for anonymous access)
CREATE POLICY "Anyone can view application by code" ON applications
    FOR SELECT USING (true);

-- Interviews policies
CREATE POLICY "Recruiters can view interviews for their jobs" ON interviews
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            WHERE a.id = interviews.application_id AND j.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can insert interview results" ON interviews
    FOR INSERT WITH CHECK (true);

-- Interview questions policies
CREATE POLICY "Recruiters can view questions for their jobs" ON interview_questions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM applications a
            JOIN jobs j ON j.id = a.job_id
            WHERE a.id = interview_questions.application_id AND j.recruiter_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can manage interview questions" ON interview_questions
    FOR ALL USING (true);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Function to generate unique interview code
CREATE OR REPLACE FUNCTION generate_interview_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Function to get application by code (for candidate app)
CREATE OR REPLACE FUNCTION get_application_by_code(p_code TEXT)
RETURNS TABLE (
    application_id UUID,
    job_title TEXT,
    job_description TEXT,
    job_requirements TEXT,
    required_skills TEXT[],
    experience_level TEXT,
    candidate_name TEXT,
    candidate_resume TEXT,
    candidate_skills JSONB,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id as application_id,
        j.title as job_title,
        j.description as job_description,
        j.requirements as job_requirements,
        j.required_skills,
        j.experience_level,
        c.name as candidate_name,
        c.resume_text as candidate_resume,
        c.parsed_skills as candidate_skills,
        a.status
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN candidates c ON c.id = a.candidate_id
    WHERE a.interview_code = p_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to start interview (updates status)
CREATE OR REPLACE FUNCTION start_interview(p_code TEXT)
RETURNS UUID AS $$
DECLARE
    app_id UUID;
BEGIN
    UPDATE applications
    SET status = 'started', started_at = NOW(), updated_at = NOW()
    WHERE interview_code = p_code AND status IN ('pending', 'invited')
    RETURNING id INTO app_id;
    
    RETURN app_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete interview (updates status and saves results)
CREATE OR REPLACE FUNCTION complete_interview(
    p_application_id UUID,
    p_transcript JSONB,
    p_questions JSONB,
    p_overall_score NUMERIC,
    p_technical_score NUMERIC,
    p_communication_score NUMERIC,
    p_strengths TEXT[],
    p_weaknesses TEXT[],
    p_summary TEXT,
    p_recommendation TEXT,
    p_duration INTEGER
)
RETURNS UUID AS $$
DECLARE
    interview_id UUID;
BEGIN
    -- Update application status
    UPDATE applications
    SET status = 'completed', completed_at = NOW(), updated_at = NOW()
    WHERE id = p_application_id;
    
    -- Insert interview record
    INSERT INTO interviews (
        application_id, transcript, questions_asked, overall_score,
        technical_score, communication_score, strengths, weaknesses,
        ai_summary, ai_recommendation, duration_minutes
    ) VALUES (
        p_application_id, p_transcript, p_questions, p_overall_score,
        p_technical_score, p_communication_score, p_strengths, p_weaknesses,
        p_summary, p_recommendation, p_duration
    ) RETURNING id INTO interview_id;
    
    RETURN interview_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER candidates_updated_at
    BEFORE UPDATE ON candidates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER applications_updated_at
    BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
