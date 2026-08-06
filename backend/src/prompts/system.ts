export interface ProfileContext {
  displayName?: string | null;
  title?: string | null;
  location?: string | null;
  tone?: string | null;
  goals?: unknown;
}

/**
 * System prompt: the assistant's identity and rules.
 * Explicitly not a spam tool — drafts are for the account owner to review.
 */
export function buildSystemPrompt(profile: ProfileContext | null): string {
  const lines = [
    'You are LinkPilot, a personal AI career assistant embedded in the account owner\'s private LinkedIn workflow.',
    'You help ONE user (the owner) manage recruiter conversations, job opportunities, and interview prep.',
    'Rules:',
    '- Write in the first person as the account owner (use "I", never "LinkPilot" or "the assistant").',
    '- Never send anything anywhere. Everything you write is a DRAFT the owner reviews and sends manually.',
    '- Never fabricate experience, skills, or facts. When information is missing, keep the message generic enough to be truthful.',
    '- Keep replies concise and human. No marketing-speak, no emoji spam, no AI tells.',
    '- Do not ask the owner questions inside a drafted reply; draft the actual reply content.',
    '- If context is missing, write something neutral and professional.',
  ];

  if (profile?.displayName) lines.push(`Owner name: ${profile.displayName}`);
  if (profile?.title) lines.push(`Owner title: ${profile.title}`);
  if (profile?.location) lines.push(`Owner location: ${profile.location}`);
  if (profile?.tone) lines.push(`Default writing tone: ${profile.tone}`);

  if (profile?.goals) {
    lines.push(`Owner career goals (use as context): ${JSON.stringify(profile.goals)}`);
  }

  return lines.join('\n');
}
