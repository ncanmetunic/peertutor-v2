/**
 * Calculate compatibility score between two users
 * based on their skills and needs overlap
 */
export const calculateCompatibility = (user1, user2) => {
  if (!user1 || !user2) return 0;

  const user1Skills = user1.skills || [];
  const user1Needs = user1.needs || [];
  const user2Skills = user2.skills || [];
  const user2Needs = user2.needs || [];

  // Count how many of user1's needs match user2's skills
  const user1NeedsMetByUser2 = user1Needs.filter(need =>
    user2Skills.includes(need)
  ).length;

  // Count how many of user2's needs match user1's skills
  const user2NeedsMetByUser1 = user2Needs.filter(need =>
    user1Skills.includes(need)
  ).length;

  // Total possible matches
  const totalNeeds = user1Needs.length + user2Needs.length;
  if (totalNeeds === 0) return 0;

  // Calculate score (percentage of needs that can be met)
  const totalMatches = user1NeedsMetByUser2 + user2NeedsMetByUser1;
  const score = Math.round((totalMatches / totalNeeds) * 100);

  return score;
};

/**
 * Find best matches for a user
 */
export const findMatches = (currentUser, allUsers, maxMatches = 10) => {
  if (!currentUser || !allUsers) return [];

  // Filter out current user and blocked users
  const blocked = currentUser.blocked || [];
  const potentialMatches = allUsers.filter(user =>
    user.id !== currentUser.id && !blocked.includes(user.id)
  );

  // Calculate compatibility for each user
  const matches = potentialMatches.map(user => ({
    ...user,
    compatibilityScore: calculateCompatibility(currentUser, user),
  }));

  // Sort by compatibility score (highest first)
  matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Return top matches (only those with score > 0)
  return matches.filter(m => m.compatibilityScore > 0).slice(0, maxMatches);
};

/**
 * Get recommended users based on specific topic
 */
export const getTopicRecommendations = (currentUser, allUsers, topicId) => {
  if (!currentUser || !allUsers || !topicId) return [];

  const blocked = currentUser.blocked || [];

  // Find users who can teach this topic (have it in skills)
  const recommendations = allUsers.filter(user => {
    if (user.id === currentUser.id) return false;
    if (blocked.includes(user.id)) return false;

    const userSkills = user.skills || [];
    return userSkills.includes(topicId);
  });

  // Calculate overall compatibility for sorting
  return recommendations
    .map(user => ({
      ...user,
      compatibilityScore: calculateCompatibility(currentUser, user),
    }))
    .sort((a, b) => b.compatibilityScore - a.compatibilityScore);
};
