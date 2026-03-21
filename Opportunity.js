// utils/aiMatcher.js
// =============================================
// REAL AI MATCHING ENGINE
// Computes compatibility score between a user
// profile and an opportunity.
// =============================================

/**
 * Normalize a string for comparison:
 * lowercase, trim, remove special chars
 */
function normalize(str) {
  return str.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
}

/**
 * Check if two skill strings are similar
 * Handles: "Python" == "python3", "ML" == "machine learning"
 */
function skillsMatch(userSkill, requiredSkill) {
  const u = normalize(userSkill);
  const r = normalize(requiredSkill);

  if (u === r) return true;
  if (u.includes(r) || r.includes(u)) return true;

  // Alias map for common abbreviations
  const aliases = {
    'ml': ['machine learning', 'machinelearning'],
    'ai': ['artificial intelligence'],
    'js': ['javascript'],
    'ts': ['typescript'],
    'py': ['python'],
    'ds': ['data science', 'data structures'],
    'fe': ['frontend', 'front end'],
    'be': ['backend', 'back end'],
    'db': ['database'],
    'dsa': ['data structures', 'algorithms'],
  };

  for (const [abbr, expansions] of Object.entries(aliases)) {
    if ((u === abbr && expansions.some(e => r.includes(e))) ||
        (r === abbr && expansions.some(e => u.includes(e)))) {
      return true;
    }
  }

  return false;
}

/**
 * MAIN MATCHING FUNCTION
 *
 * Scoring breakdown:
 *  - Skills overlap:     50% weight
 *  - Branch match:       25% weight
 *  - Year eligibility:   15% weight
 *  - CGPA threshold:     10% weight
 *
 * Returns a score 0-100
 */
function computeMatchScore(user, opportunity) {
  let score = 0;

  // ── 1. Skills Match (50 points) ──────────────
  const requiredSkills = opportunity.skillsRequired || [];
  const userSkills = user.skills || [];

  let skillScore = 0;
  if (requiredSkills.length === 0) {
    // No skills required = full score for skills section
    skillScore = 50;
  } else {
    let matchedCount = 0;
    requiredSkills.forEach(req => {
      const matched = userSkills.some(us => skillsMatch(us, req));
      if (matched) matchedCount++;
    });
    skillScore = Math.round((matchedCount / requiredSkills.length) * 50);
  }
  score += skillScore;

  // ── 2. Branch Match (25 points) ──────────────
  const eligibleBranches = opportunity.eligibleBranches || [];
  if (eligibleBranches.length === 0 || eligibleBranches.includes(user.branch)) {
    score += 25;
  } else {
    // Partial credit: related branches (e.g. CSE and IT are related)
    const related = { CSE: ['IT'], IT: ['CSE'], ECE: ['CSE'] };
    const relatedBranches = related[user.branch] || [];
    if (relatedBranches.some(b => eligibleBranches.includes(b))) {
      score += 12; // Partial match
    }
  }

  // ── 3. Year Eligibility (15 points) ──────────
  const eligibleYears = opportunity.eligibleYears || [];
  if (eligibleYears.length === 0 || eligibleYears.includes(user.year)) {
    score += 15;
  }

  // ── 4. CGPA Threshold (10 points) ────────────
  const minCGPA = opportunity.minCGPA || 0;
  if (user.cgpa >= minCGPA) {
    score += 10;
  } else if (user.cgpa >= minCGPA - 0.5) {
    score += 5; // Close enough = partial credit
  }

  // Clamp to 0-100
  return Math.min(100, Math.max(0, score));
}

/**
 * Batch compute match scores for a list of opportunities
 * Returns opportunities sorted by match score (highest first)
 */
function rankOpportunities(user, opportunities) {
  return opportunities
    .map(opp => {
      const oppObj = opp.toObject ? opp.toObject() : opp;
      oppObj.matchScore = computeMatchScore(user, opp);
      return oppObj;
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Get urgency label based on days remaining
 */
function getUrgencyLabel(deadline) {
  const days = Math.ceil((new Date(deadline) - new Date()) / (1000 * 60 * 60 * 24));
  if (days <= 0)  return 'expired';
  if (days <= 2)  return 'critical';
  if (days <= 7)  return 'urgent';
  if (days <= 14) return 'soon';
  return 'open';
}

module.exports = { computeMatchScore, rankOpportunities, getUrgencyLabel };
