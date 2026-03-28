// Supabase Client Configuration
// Shared between recruiter portal and candidate app
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured. Using mock mode.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================
// API FUNCTIONS - FOR CANDIDATE APP
// ============================================================

/**
 * Fetch application details by interview code
 * Used by candidate app when entering a code
 * @param {string} code - The 6-character interview code
 * @returns {Promise<Object|null>} Application details or null
 */
export async function getApplicationByCode(code) {
  // If Supabase is not configured, use localStorage fallback
  if (!supabaseUrl || !supabaseAnonKey) {
    const stored = localStorage.getItem(`interview_${code}`);
    if (stored) {
      const data = JSON.parse(stored);
      return {
        application_id: code,
        job_title: data.jobTitle || 'Software Developer',
        job_description: data.jobDescription || '',
        job_requirements: data.jobRequirements || '',
        required_skills: data.requiredSkills || [],
        experience_level: data.experienceLevel || 'any',
        candidate_name: data.name || '',
        candidate_resume: data.resume || '',
        candidate_skills: data.parsedResume?.skills || {},
        status: 'pending'
      };
    }
    return null;
  }

  const { data, error } = await supabase
    .rpc('get_application_by_code', { p_code: code.toUpperCase() });
  
  if (error) {
    console.error('Error fetching application:', error);
    return null;
  }
  
  return data?.[0] || null;
}

/**
 * Mark interview as started
 * @param {string} code - The interview code
 * @returns {Promise<string|null>} Interview ID or null
 */
export async function startInterview(code) {
  if (!supabaseUrl || !supabaseAnonKey) {
    return code; // Mock: return code as ID
  }

  const { data, error } = await supabase
    .rpc('start_interview', { p_code: code.toUpperCase() });
  
  if (error) {
    console.error('Error starting interview:', error);
    return null;
  }
  
  return data;
}

/**
 * Submit completed interview results
 * @param {string} applicationId - The application ID
 * @param {Object} results - Interview results
 * @returns {Promise<string|null>} Interview ID or null
 */
export async function completeInterview(applicationId, results) {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Store locally as fallback
    const reportData = {
      ...results,
      completedAt: new Date().toISOString()
    };
    localStorage.setItem(`interview_result_${applicationId}`, JSON.stringify(reportData));
    return applicationId;
  }

  const { data, error } = await supabase
    .rpc('complete_interview', {
      p_application_id: applicationId,
      p_transcript: results.transcript,
      p_questions: results.questions,
      p_overall_score: results.overallScore,
      p_technical_score: results.technicalScore,
      p_communication_score: results.communicationScore,
      p_strengths: results.strengths,
      p_weaknesses: results.weaknesses,
      p_summary: results.summary,
      p_recommendation: results.recommendation,
      p_duration: results.durationMinutes
    });
  
  if (error) {
    console.error('Error completing interview:', error);
    return null;
  }
  
  return data;
}

// ============================================================
// API FUNCTIONS - FOR RECRUITER PORTAL
// ============================================================

/**
 * Create a new job posting
 * @param {Object} job - Job data
 * @returns {Promise<Object|null>} Created job or null
 */
export async function createJob(job) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('jobs')
    .insert({ ...job, recruiter_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating job:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all jobs for current recruiter
 * @returns {Promise<Array>} List of jobs
 */
export async function getJobs() {
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create a new candidate
 * @param {Object} candidate - Candidate data
 * @returns {Promise<Object|null>} Created candidate or null
 */
export async function createCandidate(candidate) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('candidates')
    .insert({ ...candidate, recruiter_id: user.id })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating candidate:', error);
    return null;
  }
  
  return data;
}

/**
 * Get all candidates for current recruiter
 * @returns {Promise<Array>} List of candidates
 */
export async function getCandidates() {
  const { data, error } = await supabase
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching candidates:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Create application and send interview invitation
 * @param {string} jobId - Job ID
 * @param {string} candidateId - Candidate ID
 * @param {string} supabaseFunctionsUrl - Edge Functions URL (optional)
 * @returns {Promise<Object|null>} Created application or null
 */
export async function inviteCandidate(jobId, candidateId, supabaseFunctionsUrl) {
  // Generate unique code
  const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const interviewCode = generateCode();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

  const { data: application, error } = await supabase
    .from('applications')
    .insert({
      job_id: jobId,
      candidate_id: candidateId,
      interview_code: interviewCode,
      status: 'invited',
      invited_at: new Date().toISOString(),
      expires_at: expiresAt.toISOString()
    })
    .select(`
      *,
      job:jobs(*),
      candidate:candidates(*)
    `)
    .single();
  
  if (error) {
    console.error('Error creating application:', error);
    return null;
  }

  // Send email via Edge Function
  if (supabaseFunctionsUrl && application.candidate && application.job) {
    try {
      await fetch(`${supabaseFunctionsUrl}/send-interview-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: application.candidate.email,
          candidateName: application.candidate.name,
          jobTitle: application.job.title,
          companyName: application.job.company,
          interviewCode: interviewCode,
          expiresAt: expiresAt.toISOString()
        })
      });
    } catch (e) {
      console.error('Failed to send email:', e);
    }
  }
  
  return application;
}

/**
 * Get all applications with details
 * @param {string} jobId - Filter by job (optional)
 * @returns {Promise<Array>} List of applications
 */
export async function getApplications(jobId) {
  let query = supabase
    .from('applications')
    .select(`
      *,
      job:jobs(*),
      candidate:candidates(*),
      interview:interviews(*)
    `)
    .order('created_at', { ascending: false });
  
  if (jobId) {
    query = query.eq('job_id', jobId);
  }

  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching applications:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get interview results for an application
 * @param {string} applicationId - Application ID
 * @returns {Promise<Object|null>} Interview results or null
 */
export async function getInterviewResults(applicationId) {
  const { data, error } = await supabase
    .from('interviews')
    .select('*')
    .eq('application_id', applicationId)
    .single();
  
  if (error) {
    console.error('Error fetching interview:', error);
    return null;
  }
  
  return data;
}

export default supabase;
