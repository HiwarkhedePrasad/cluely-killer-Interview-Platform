import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, User, Briefcase, Code, Sparkles, Copy, Check, ArrowRight, Plus, X, Terminal, Building2, AlertCircle } from 'lucide-react';
import { parseResume } from '../services/resumeParser';
import { getApplicationByCode, startInterview } from '../services/supabase';
import * as pdfjsLib from 'pdfjs-dist';
import './InterviewSetup.css';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

/**
 * Extract text from a file — handles PDFs via pdfjs-dist, plain text otherwise
 */
async function extractTextFromFile(file) {
  if (file.type === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf')) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(item => item.str).join(' ');
        fullText += pageText + '\n';
      }
      return fullText.trim();
    } catch (err) {
      console.error('PDF parsing failed:', err);
      return await file.text();
    }
  }
  return await file.text();
}

function generateInterviewCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function InterviewSetup({ onStartInterview, onJoinWithCode }) {
  const [mode, setMode] = useState('join'); // Default to join mode for candidates
  const [candidateName, setCandidateName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [projects, setProjects] = useState([{ name: '', description: '', technologies: '' }]);
  const [generatedCode, setGeneratedCode] = useState('');
  const [codeCopied, setCodeCopied] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [applicationData, setApplicationData] = useState(null);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await extractTextFromFile(file);
    setResumeText(text);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const text = await extractTextFromFile(file);
      setResumeText(text);
    }
  };

  const addProject = () => setProjects([...projects, { name: '', description: '', technologies: '' }]);
  const updateProject = (index, field, value) => {
    const updated = [...projects];
    updated[index][field] = value;
    setProjects(updated);
  };
  const removeProject = (index) => setProjects(projects.filter((_, i) => i !== index));

  const handleGenerateInterview = () => {
    const code = generateInterviewCode();
    setGeneratedCode(code);
    const parsedResume = parseResume(resumeText);
    const candidateData = {
      name: candidateName,
      resume: resumeText,
      parsedResume,
      skills: parsedResume.skills,
      experienceLevel: parsedResume.experienceLevel,
      yearsOfExperience: parsedResume.yearsOfExperience,
      projects: projects.filter(p => p.name.trim()).length > 0
        ? projects.filter(p => p.name.trim()).map(p => ({
            name: p.name,
            description: p.description,
            technologies: p.technologies.split(',').map(t => t.trim()).filter(Boolean)
          }))
        : parsedResume.projects,
      interviewCode: code
    };
    localStorage.setItem(`interview_${code}`, JSON.stringify(candidateData));
  };

  const handleStartInterview = () => {
    const candidateData = JSON.parse(localStorage.getItem(`interview_${generatedCode}`) || '{}');
    onStartInterview?.(candidateData);
  };

  // Special demo code that directly enters interview with mock data
  const DEMO_CODE = 'DEMOCO';

  const handleJoinWithCode = async () => {
    if (joinCode.length !== 6) return;

    setIsLoading(true);
    setError('');

    // Check for direct/demo code - enters interview immediately
    if (joinCode.toUpperCase() === DEMO_CODE) {
      const demoData = {
        name: 'Demo Candidate',
        resume: 'Experienced software developer with strong JavaScript and React skills.',
        parsedResume: {
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
          experienceLevel: 'Mid',
          yearsOfExperience: 5,
          projects: [
            { name: 'E-commerce Platform', description: 'Built a full-stack shopping app', technologies: ['React', 'Node.js', 'MongoDB'] },
            { name: 'Task Manager API', description: 'REST API for task management', technologies: ['Python', 'FastAPI', 'PostgreSQL'] }
          ]
        },
        skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL'],
        experienceLevel: 'Mid',
        projects: [
          { name: 'E-commerce Platform', description: 'Built a full-stack shopping app', technologies: ['React', 'Node.js', 'MongoDB'] },
          { name: 'Task Manager API', description: 'REST API for task management', technologies: ['Python', 'FastAPI', 'PostgreSQL'] }
        ],
        interviewCode: DEMO_CODE,
        isDemo: true,
        jobData: {
          title: 'Senior Software Engineer',
          description: 'Build and maintain web applications',
          requirements: '5+ years experience with JavaScript',
          requiredSkills: ['JavaScript', 'React', 'Node.js', 'TypeScript'],
          experienceLevel: 'Mid'
        }
      };
      onJoinWithCode?.(demoData);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch application data from Supabase
      const appData = await getApplicationByCode(joinCode);

      if (!appData) {
        setError('Invalid interview code. Please check and try again.');
        setIsLoading(false);
        return;
      }

      if (appData.status === 'completed') {
        setError('This interview has already been completed.');
        setIsLoading(false);
        return;
      }

      if (appData.status === 'expired') {
        setError('This interview code has expired. Please contact the recruiter.');
        setIsLoading(false);
        return;
      }

      // Parse the resume if available
      const parsedResume = appData.candidate_resume ? parseResume(appData.candidate_resume) : null;

      // Build candidate data with job context
      const candidateData = {
        name: appData.candidate_name,
        resume: appData.candidate_resume,
        parsedResume: parsedResume,
        skills: appData.candidate_skills || parsedResume?.skills,
        experienceLevel: appData.experience_level || parsedResume?.experienceLevel,
        projects: parsedResume?.projects || [],
        interviewCode: joinCode,
        applicationId: appData.application_id,
        // Job-specific data
        jobData: {
          title: appData.job_title,
          description: appData.job_description,
          requirements: appData.job_requirements,
          requiredSkills: appData.required_skills || [],
          experienceLevel: appData.experience_level
        }
      };

      // Store for display before starting
      setApplicationData(candidateData);
      setIsLoading(false);

    } catch (err) {
      console.error('Error fetching application:', err);
      setError('Failed to load interview. Please try again.');
      setIsLoading(false);
    }
  };

  const handleStartScreeningInterview = async () => {
    if (!applicationData) return;
    
    setIsLoading(true);
    
    try {
      // Mark interview as started in Supabase
      await startInterview(joinCode);
      
      // Proceed to interview
      onJoinWithCode?.(applicationData);
    } catch (err) {
      console.error('Error starting interview:', err);
      setError('Failed to start interview. Please try again.');
      setIsLoading(false);
    }
  };

  // Legacy: Keep the old generate flow for demo/testing purposes
  const handleJoinWithCodeLegacy = () => {
    const candidateData = JSON.parse(localStorage.getItem(`interview_${joinCode}`) || 'null');
    if (candidateData) {
      onJoinWithCode?.(candidateData);
    } else {
      // Try Supabase
      handleJoinWithCode();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  return (
    <div className="is">
      {/* Left decorative strip */}
      <div className="is__strip" aria-hidden="true">
        <span className="is__strip-text">INTERVIEW</span>
        <span className="is__strip-text">PLATFORM</span>
        <span className="is__strip-dot" />
      </div>

      <div className="is__body">
        {/* Header row */}
        <header className="is__header">
          <div className="is__header-left">
            <Terminal size={16} strokeWidth={2.5} />
            <span className="is__badge">SETUP</span>
          </div>
          <nav className="is__nav">
            <button className={`is__nav-btn ${mode === 'setup' ? 'is__nav-btn--on' : ''}`} onClick={() => setMode('setup')}>New</button>
            <span className="is__nav-sep">/</span>
            <button className={`is__nav-btn ${mode === 'join' ? 'is__nav-btn--on' : ''}`} onClick={() => setMode('join')}>Join</button>
          </nav>
        </header>

        {/* Content */}
        <div className="is__content">
          {mode === 'setup' ? (
            !generatedCode ? (
              <div className="is__grid">
                {/* LEFT COLUMN — Name + Resume */}
                <div className="is__col">
                  <div className="is__field">
                    <label className="is__lbl"><span className="is__num">01</span>Candidate</label>
                    <input className="is__inp" type="text" value={candidateName} onChange={e => setCandidateName(e.target.value)} placeholder="Full name" autoComplete="off" />
                  </div>

                  <div className="is__field">
                    <label className="is__lbl"><span className="is__num">02</span>Resume</label>
                    <div
                      className={`is__drop ${dragActive ? 'is__drop--on' : ''} ${resumeText ? 'is__drop--done' : ''}`}
                      onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                      onClick={() => !resumeText && fileInputRef.current?.click()}
                    >
                      <input ref={fileInputRef} type="file" accept=".txt,.pdf,.doc,.docx" onChange={handleFileUpload} style={{ display: 'none' }} />
                      {resumeText ? (
                        <div className="is__drop-ok">
                          <FileText size={14} />
                          <span>{resumeText.length} chars loaded</span>
                          <button className="is__drop-x" onClick={e => { e.stopPropagation(); setResumeText(''); }}><X size={12} /></button>
                        </div>
                      ) : (
                        <>
                          <Upload size={16} />
                          <span>Drop file or click</span>
                        </>
                      )}
                    </div>
                    <textarea className="is__ta" value={resumeText} onChange={e => setResumeText(e.target.value)} placeholder="Or paste resume / background..." rows={3} />
                  </div>
                </div>

                {/* RIGHT COLUMN — Projects + CTA */}
                <div className="is__col">
                  <div className="is__field is__field--grow">
                    <label className="is__lbl"><span className="is__num">03</span>Projects</label>
                    <div className="is__projects">
                      {projects.map((project, i) => (
                        <div key={i} className="is__proj">
                          <div className="is__proj-top">
                            <span className="is__proj-n">{String(i + 1).padStart(2, '0')}</span>
                            {projects.length > 1 && <button className="is__proj-rm" onClick={() => removeProject(i)}><X size={12} /></button>}
                          </div>
                          <input className="is__inp is__inp--s" value={project.name} onChange={e => updateProject(i, 'name', e.target.value)} placeholder="Name" />
                          <input className="is__inp is__inp--s" value={project.description} onChange={e => updateProject(i, 'description', e.target.value)} placeholder="Description" />
                          <input className="is__inp is__inp--s" value={project.technologies} onChange={e => updateProject(i, 'technologies', e.target.value)} placeholder="Tech (comma sep)" />
                        </div>
                      ))}
                    </div>
                    <button className="is__add" onClick={addProject}><Plus size={12} /> Add project</button>
                  </div>
                </div>

                {/* CTA — full width below grid */}
                <div className="is__cta-row">
                  <button className="is__cta" onClick={handleGenerateInterview} disabled={!candidateName.trim()}>
                    <span>Generate Code</span>
                    <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ) : (
              /* Success state */
              <div className="is__done">
                <div className="is__done-icon"><Check size={24} strokeWidth={3} /></div>
                <h2 className="is__done-h">Ready.</h2>
                <p className="is__done-p">Share the code or start now.</p>
                <div className="is__code">
                  {generatedCode.split('').map((c, i) => (
                    <span key={i} className="is__code-c" style={{ animationDelay: `${i * 0.07}s` }}>{c}</span>
                  ))}
                  <button className="is__code-cp" onClick={copyCode}>{codeCopied ? <Check size={12} /> : <Copy size={12} />}</button>
                </div>
                <div className="is__done-btns">
                  <button className="is__cta" onClick={handleStartInterview}><span>Start Interview</span><ArrowRight size={16} /></button>
                  <button className="is__ghost" onClick={() => setGeneratedCode('')}>New Setup</button>
                </div>
              </div>
            )
          ) : (
            /* Join mode */
            <div className="is__join">
              {!applicationData ? (
                // Code entry screen
                <>
                  <Code size={32} strokeWidth={1.5} className="is__join-icon" />
                  <h2 className="is__join-h">Enter Code</h2>
                  <p className="is__join-p">6-character code or type <strong>DEMO</strong> to try</p>
                  
                  {error && (
                    <div className="is__error">
                      <AlertCircle size={14} />
                      <span>{error}</span>
                    </div>
                  )}
                  
                  <input
                    ref={el => { if (el && mode === 'join' && !applicationData) setTimeout(() => el.focus(), 100); }}
                    type="text"
                    className="is__join-real-inp"
                    value={joinCode}
                    onChange={e => {
                      setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6));
                      setError('');
                    }}
                    maxLength={6}
                    placeholder={joinCode.toUpperCase() === 'DEMO' ? 'DEMO ✓' : 'XXXXXX'}
                    spellCheck={false}
                    autoComplete="off"
                    disabled={isLoading}
                  />
                  <button 
                    className="is__cta is__cta--narrow" 
                    onClick={handleJoinWithCode} 
                    disabled={joinCode.length !== 6 || isLoading}
                  >
                    <span>{isLoading ? 'Loading...' : 'Continue'}</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              ) : (
                // Job details confirmation screen
                <>
                  <div className="is__job-confirm">
                    <div className="is__job-icon">
                      <Building2 size={28} />
                    </div>
                    <h2 className="is__join-h">Ready for Interview</h2>
                    
                    <div className="is__job-card">
                      <div className="is__job-title">{applicationData.jobData?.title || 'Software Developer'}</div>
                      {applicationData.jobData?.requiredSkills?.length > 0 && (
                        <div className="is__job-skills">
                          {applicationData.jobData.requiredSkills.slice(0, 5).map((skill, i) => (
                            <span key={i} className="is__skill-tag">{skill}</span>
                          ))}
                          {applicationData.jobData.requiredSkills.length > 5 && (
                            <span className="is__skill-more">+{applicationData.jobData.requiredSkills.length - 5}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="is__job-candidate">
                      <User size={14} />
                      <span>{applicationData.name}</span>
                    </div>
                    
                    <div className="is__job-info">
                      <p>You'll be interviewed by 3 AI agents who will ask questions based on your resume and the job requirements.</p>
                      <p>The interview typically takes 20-30 minutes.</p>
                    </div>
                    
                    <div className="is__done-btns">
                      <button 
                        className="is__cta" 
                        onClick={handleStartScreeningInterview}
                        disabled={isLoading}
                      >
                        <span>{isLoading ? 'Starting...' : 'Start Interview'}</span>
                        <ArrowRight size={16} />
                      </button>
                      <button 
                        className="is__ghost" 
                        onClick={() => {
                          setApplicationData(null);
                          setJoinCode('');
                          setError('');
                        }}
                      >
                        Use Different Code
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default InterviewSetup;
