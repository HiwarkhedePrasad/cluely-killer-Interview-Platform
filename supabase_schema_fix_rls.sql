-- ============================================================
-- RECRUITMENT SCREENING PLATFORM - DATABASE SCHEMA FIX
-- ============================================================
-- Run this AFTER the initial schema if data is not showing
-- This drops and recreates all RLS policies
-- ============================================================

-- ============================================================
-- DROP EXISTING POLICIES (if any exist with different names)
-- ============================================================

DROP POLICY IF EXISTS "Recruiters can view their own jobs" ON jobs;
DROP POLICY IF EXISTS "Recruiters can insert their own jobs" ON jobs;
DROP POLICY IF EXISTS "Recruiters can update their own jobs" ON jobs;
DROP POLICY IF EXISTS "Recruiters can delete their own jobs" ON jobs;

DROP POLICY IF EXISTS "Recruiters can view their own candidates" ON candidates;
DROP POLICY IF EXISTS "Recruiters can insert their own candidates" ON candidates;
DROP POLICY IF EXISTS "Recruiters can update their own candidates" ON candidates;
DROP POLICY IF EXISTS "Recruiters can delete their own candidates" ON candidates;

DROP POLICY IF EXISTS "Recruiters can view applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Recruiters can insert applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Recruiters can update applications for their jobs" ON applications;
DROP POLICY IF EXISTS "Anyone can view application by code" ON applications;

DROP POLICY IF EXISTS "Recruiters can view interviews for their jobs" ON interviews;
DROP POLICY IF EXISTS "Anyone can insert interview results" ON interviews;

DROP POLICY IF EXISTS "Recruiters can view questions for their jobs" ON interview_questions;
DROP POLICY IF EXISTS "Anyone can manage interview questions" ON interview_questions;

-- ============================================================
-- ENABLE RLS (in case it was disabled)
-- ============================================================

ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE interviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_questions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RECREATE POLICIES
-- ============================================================

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

-- Applications policies
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
-- VERIFY RLS IS WORKING
-- ============================================================
-- Run this query as a logged-in recruiter to test:
-- SELECT * FROM jobs;
-- You should see only jobs where recruiter_id matches your user ID
-- ============================================================
