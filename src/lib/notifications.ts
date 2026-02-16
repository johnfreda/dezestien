import { prisma } from './prisma';

/**
 * Extract @mentions from text
 * Returns array of usernames (without @)
 */
export function extractMentions(text: string): string[] {
  const mentionRegex = /@(\w+)/g;
  const matches = text.matchAll(mentionRegex);
  const mentions: string[] = [];
  
  for (const match of matches) {
    const username = match[1].toLowerCase();
    if (!mentions.includes(username)) {
      mentions.push(username);
    }
  }
  
  return mentions;
}

/**
 * Find user IDs by username (case-insensitive)
 */
export async function findUserIdsByUsernames(usernames: string[]): Promise<Record<string, string>> {
  if (usernames.length === 0) return {};
  
  // Fetch all users and match case-insensitively
  const users = await prisma.user.findMany({
    where: {
      name: {
        not: null,
      },
    },
    select: {
      id: true,
      name: true,
    },
  });
  
  const mapping: Record<string, string> = {};
  const usernamesLower = usernames.map(u => u.toLowerCase());
  
  for (const user of users) {
    if (user.name) {
      const nameLower = user.name.toLowerCase();
      if (usernamesLower.includes(nameLower)) {
        mapping[nameLower] = user.id;
      }
    }
  }
  
  return mapping;
}

/**
 * Create notification for mentions
 */
export async function createMentionNotifications(
  content: string,
  actorId: string,
  actorName: string | null,
  contextType: 'comment' | 'forum_reply',
  contextId: string,
  articleSlug?: string,
  topicId?: string,
  targetCommentId?: string,
  targetReplyId?: string
) {
  const mentions = extractMentions(content);
  if (mentions.length === 0) return;
  
  const userIdMap = await findUserIdsByUsernames(mentions);
  
  const notifications = [];
  for (const [username, userId] of Object.entries(userIdMap)) {
    // Don't notify yourself
    if (userId === actorId) continue;
    
    notifications.push({
      type: 'mention',
      userId,
      actorId,
      actorName: actorName || 'Anoniem',
      contextType,
      contextId,
      articleSlug: articleSlug || null,
      topicId: topicId || null,
      targetCommentId: targetCommentId || null,
      targetReplyId: targetReplyId || null,
    });
  }
  
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications,
      skipDuplicates: true,
    });
  }
}

/**
 * Create notification for reply
 */
export async function createReplyNotification(
  parentUserId: string,
  actorId: string,
  actorName: string | null,
  contextType: 'comment' | 'forum_reply',
  contextId: string,
  articleSlug?: string,
  topicId?: string,
  targetCommentId?: string,
  targetReplyId?: string
) {
  // Don't notify yourself
  if (parentUserId === actorId) return;
  
  await prisma.notification.create({
    data: {
      type: 'reply',
      userId: parentUserId,
      actorId,
      actorName: actorName || 'Anoniem',
      contextType,
      contextId,
      articleSlug: articleSlug || null,
      topicId: topicId || null,
      targetCommentId: targetCommentId || null,
      targetReplyId: targetReplyId || null,
    },
  });
}
