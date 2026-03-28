/**
 * Question Generation Service
 * Generates project-based technical interview questions
 * based on candidate's resume, skills, AND job requirements
 * 
 * RECRUITMENT SCREENING VERSION:
 * - Prioritizes questions about required job skills
 * - Evaluates fit for specific role
 */

import { parseResume, generateCandidateContext } from './resumeParser';

/**
 * Question templates for different categories
 * These are NOT DSA questions - they focus on practical experience
 */
const QUESTION_TEMPLATES = {
  projectDeepDive: [
    "Tell me about {project}. What was your role and what were the main challenges you faced?",
    "In {project}, how did you decide on the architecture? What alternatives did you consider?",
    "What would you do differently if you were to rebuild {project} from scratch?",
    "Can you walk me through the most complex feature you implemented in {project}?",
    "How did you handle testing and quality assurance in {project}?",
    "What was the deployment process like for {project}? Any CI/CD involved?"
  ],
  
  skillBased: {
    'React': [
      "How do you manage state in your React applications? When would you use Context vs Redux vs something else?",
      "Tell me about a performance optimization you've done in a React app.",
      "How do you handle side effects in React? Compare useEffect patterns you've used.",
      "What's your approach to component composition and reusability?"
    ],
    'Node.js': [
      "How do you handle errors and logging in your Node.js applications?",
      "Tell me about a time you had to optimize a Node.js API for better performance.",
      "How do you handle authentication and authorization in your backend services?",
      "What's your experience with event-driven architecture in Node.js?"
    ],
    'Python': [
      "How do you structure larger Python projects? What patterns do you follow?",
      "Tell me about your experience with async programming in Python.",
      "How do you handle dependencies and virtual environments?",
      "What testing frameworks and practices do you use with Python?"
    ],
    'PostgreSQL': [
      "How do you design database schemas? Walk me through your thought process.",
      "Tell me about a complex query you've written and optimized.",
      "How do you handle database migrations in production?",
      "What's your experience with database indexing strategies?"
    ],
    'MongoDB': [
      "When would you choose MongoDB over a relational database?",
      "How do you design document schemas? When do you embed vs reference?",
      "Tell me about aggregation pipelines you've built.",
      "How do you handle data consistency in MongoDB?"
    ],
    'Docker': [
      "Walk me through how you containerize an application.",
      "How do you handle multi-container applications? Docker Compose experience?",
      "What's your experience with container orchestration?",
      "How do you handle secrets and configuration in containers?"
    ],
    'AWS': [
      "What AWS services have you worked with? Tell me about a typical architecture you've built.",
      "How do you handle infrastructure as code? Terraform, CloudFormation?",
      "Tell me about a scaling challenge you solved on AWS.",
      "What's your experience with serverless architectures?"
    ],
    'TypeScript': [
      "How has TypeScript improved your development workflow?",
      "Tell me about a time when TypeScript caught a bug before runtime.",
      "How do you handle typing for API responses and complex objects?",
      "What's your approach to organizing types in a large codebase?"
    ]
  },
  
  architecture: [
    "How do you approach designing a new system from scratch?",
    "Tell me about a time you had to refactor a poorly designed system.",
    "How do you balance technical debt with feature delivery?",
    "What's your experience with microservices vs monolithic architectures?",
    "How do you handle cross-cutting concerns like logging, monitoring, and security?"
  ],
  
  teamwork: [
    "How do you approach code reviews? What do you look for?",
    "Tell me about a time you had a technical disagreement with a colleague.",
    "How do you onboard new team members to a complex codebase?",
    "What's your experience with agile methodologies?"
  ],
  
  problemSolving: [
    "Tell me about the most difficult bug you've had to track down.",
    "How do you approach debugging production issues?",
    "Walk me through how you'd investigate a performance bottleneck.",
    "Tell me about a time you had to learn a new technology quickly."
  ]
};

/**
 * Generate questions based on candidate's profile AND job requirements
 */
export function generateQuestions(candidateData, jobData = null) {
  const questions = [];
  const { skills, projects } = candidateData.parsedResume || parseResume(candidateData.resume || '');

  // If job data is available, prioritize required skills questions
  if (jobData && jobData.requiredSkills && jobData.requiredSkills.length > 0) {
    jobData.requiredSkills.forEach((skill, index) => {
      const skillQuestions = QUESTION_TEMPLATES.skillBased[skill];
      if (skillQuestions) {
        const question = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
        questions.push({
          category: 'job-requirement',
          question,
          relatedTo: skill,
          priority: 0, // Highest priority
          isRequired: true
        });
      } else {
        // Generate a generic question for skills not in templates
        questions.push({
          category: 'job-requirement',
          question: `Tell me about your experience with ${skill}. What projects have you used it in?`,
          relatedTo: skill,
          priority: 0,
          isRequired: true
        });
      }
    });
  }

  // Project-based questions (highest priority after job requirements)
  const candidateProjects = candidateData.projects || projects || [];
  candidateProjects.slice(0, 3).forEach(project => {
    const projectName = project.name || project;
    const templates = QUESTION_TEMPLATES.projectDeepDive;
    const template = templates[Math.floor(Math.random() * templates.length)];
    questions.push({
      category: 'project',
      question: template.replace('{project}', projectName),
      relatedTo: projectName,
      priority: 1
    });
  });

  // Skill-based questions from candidate's resume
  const allSkills = [
    ...(skills?.languages || []),
    ...(skills?.frontend || []),
    ...(skills?.backend || []),
    ...(skills?.database || []),
    ...(skills?.devops || [])
  ];

  // Filter out skills already covered by job requirements
  const jobRequiredSkills = (jobData?.requiredSkills || []).map(s => s.toLowerCase());
  const remainingSkills = allSkills.filter(s => 
    !jobRequiredSkills.includes(s.toLowerCase())
  );

  remainingSkills.slice(0, 3).forEach(skill => {
    const skillQuestions = QUESTION_TEMPLATES.skillBased[skill];
    if (skillQuestions) {
      const question = skillQuestions[Math.floor(Math.random() * skillQuestions.length)];
      questions.push({
        category: 'technical',
        question,
        relatedTo: skill,
        priority: 2
      });
    }
  });

  // Job-specific experience questions
  if (jobData) {
    const targetLevel = jobData.experienceLevel || candidateData.experienceLevel;
    
    if (targetLevel === 'senior' || targetLevel === 'lead') {
      questions.push({
        category: 'job-fit',
        question: `This role requires ${targetLevel}-level expertise. Can you describe a situation where you led a technical initiative or mentored other developers?`,
        priority: 1
      });
    }
    
    if (jobData.minYearsExperience && jobData.minYearsExperience > 0) {
      questions.push({
        category: 'job-fit',
        question: `Walk me through your most significant achievement over your ${jobData.minYearsExperience}+ years of experience.`,
        priority: 1
      });
    }
  }

  // Architecture questions (for mid/senior)
  const effectiveLevel = jobData?.experienceLevel || candidateData.experienceLevel;
  if (effectiveLevel !== 'junior') {
    const archQ = QUESTION_TEMPLATES.architecture;
    questions.push({
      category: 'architecture',
      question: archQ[Math.floor(Math.random() * archQ.length)],
      priority: 3
    });
  }

  // Problem-solving questions
  const problemQ = QUESTION_TEMPLATES.problemSolving;
  questions.push({
    category: 'problem-solving',
    question: problemQ[Math.floor(Math.random() * problemQ.length)],
    priority: 4
  });

  // Sort by priority and return
  return questions.sort((a, b) => a.priority - b.priority);
}

/**
 * Get a follow-up question based on previous answer
 */
export function getFollowUpPrompt(previousQuestion, skill) {
  return `Based on the candidate's answer to "${previousQuestion}", ask a thoughtful follow-up question that digs deeper into their experience. Focus on specifics, trade-offs, or lessons learned.`;
}

/**
 * Generate an opening question for the interview
 * Now includes job context
 */
export function getOpeningQuestion(candidateData, jobData = null) {
  // If we have job data, mention the role
  if (jobData && jobData.title) {
    const projects = candidateData.projects || [];
    if (projects.length > 0) {
      const project = projects[0];
      return `Thanks for applying for the ${jobData.title} role. I see you worked on ${project.name || project}. That looks relevant! Can you give me a brief overview of what it does and how it relates to the kind of work you'd do in this role?`;
    }
    return `Thanks for applying for the ${jobData.title} position. To get started, tell me about a recent project that you think best demonstrates the skills needed for this role.`;
  }
  
  // Fallback to original behavior
  const projects = candidateData.projects || [];
  if (projects.length > 0) {
    const project = projects[0];
    return `I see you worked on ${project.name || project}. That sounds interesting! Can you give me a brief overview of what it does and what your main contributions were?`;
  }
  
  return "Let's start by having you tell me about a recent project you're proud of. What did you build and what was your role?";
}

/**
 * Create agent-specific question prompts
 * Now includes job requirements context
 */
export function getAgentQuestionPrompt(agentType, candidateData, conversationHistory, jobData = null) {
  const context = generateCandidateContext(
    candidateData.parsedResume || parseResume(candidateData.resume || ''),
    candidateData.name
  );

  // Add job context if available
  let jobContext = '';
  if (jobData) {
    jobContext = `
--- JOB REQUIREMENTS ---
Position: ${jobData.title || 'Software Developer'}
Required Skills: ${(jobData.requiredSkills || []).join(', ')}
Experience Level: ${jobData.experienceLevel || 'any'}
${jobData.requirements ? `Requirements: ${jobData.requirements}` : ''}
--- END JOB REQUIREMENTS ---

YOUR PRIMARY GOAL: Evaluate if this candidate is qualified for THIS SPECIFIC ROLE.
Focus questions on the required skills and determine their proficiency level.
`;
  }

  const basePrompts = {
    peer: `You are Alex, a friendly peer developer conducting a casual technical conversation. 
Ask about fundamentals and day-to-day development practices. Be encouraging and conversational.
Focus on: How they approach problems, their learning process, tools they use daily.
${jobData ? 'Evaluate their comfort level with the required skills for this role.' : ''}`,
    
    teamLead: `You are Sarah, a tech lead evaluating architecture and system design capabilities.
Ask about design decisions, scalability considerations, and team collaboration.
Focus on: Why they made certain choices, how they handle complexity, cross-team communication.
${jobData ? 'Assess if their experience level matches what this role requires.' : ''}`,
    
    veteran: `You are James, a principal engineer with deep expertise. 
Dig into edge cases, performance implications, and long-term maintainability.
Focus on: Trade-offs, failure scenarios, production issues, technical debt management.
${jobData ? 'Determine the depth of their expertise in the required skills.' : ''}`
  };

  return `${basePrompts[agentType]}

${jobContext}
${context}

IMPORTANT RULES:
- Ask ONE question at a time
- Base questions on their specific projects and skills listed above
${jobData ? '- PRIORITIZE questions about REQUIRED SKILLS for this job' : ''}
- DO NOT ask DSA, leetcode, or algorithm questions
- Focus on their real experience and decision-making
- Keep responses conversational (2-3 sentences max)

${conversationHistory.length > 0 ? 'Continue the conversation naturally based on what has been discussed.' : 'Start with a warm greeting and your first question.'}`;
}

export default {
  generateQuestions,
  getFollowUpPrompt,
  getOpeningQuestion,
  getAgentQuestionPrompt
};
