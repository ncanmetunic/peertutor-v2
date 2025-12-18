import { doc, getDoc, updateDoc, collection, query, where, getDocs, orderBy, limit, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Check if user has admin role
 */
export async function isAdmin(userId) {
  if (!userId) return false;

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();
    return userData?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Grant admin role to user
 */
export async function grantAdminRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'admin',
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error granting admin role:', error);
    throw error;
  }
}

/**
 * Revoke admin role from user
 */
export async function revokeAdminRole(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: 'user', // Default role
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error revoking admin role:', error);
    throw error;
  }
}

/**
 * Get all users with pagination
 */
export async function getAllUsers({ page = 1, pageSize = 20, searchQuery = '', filterRole = 'all' }) {
  try {
    const usersRef = collection(db, 'users');
    let q = query(usersRef, orderBy('createdAt', 'desc'));

    // Apply role filter
    if (filterRole !== 'all') {
      q = query(usersRef, where('role', '==', filterRole), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    let users = [];

    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData,
      });
    });

    // Client-side search filtering (could be optimized with Algolia/Elasticsearch)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (user) =>
          user.displayName?.toLowerCase().includes(query) ||
          user.email?.toLowerCase().includes(query)
      );
    }

    // Client-side pagination
    const totalUsers = users.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedUsers = users.slice(start, end);

    return {
      users: paginatedUsers,
      totalUsers,
      totalPages: Math.ceil(totalUsers / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

/**
 * Get user statistics
 */
export async function getUserStatistics() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    let totalUsers = 0;
    let activeUsers = 0;
    let adminUsers = 0;
    let bannedUsers = 0;

    snapshot.forEach((doc) => {
      const user = doc.data();
      totalUsers++;

      if (user.role === 'admin') adminUsers++;
      if (user.status === 'banned') bannedUsers++;

      // Consider user active if they've logged in within last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      if (user.lastLoginAt && user.lastLoginAt.toDate() > sevenDaysAgo) {
        activeUsers++;
      }
    });

    return {
      totalUsers,
      activeUsers,
      adminUsers,
      bannedUsers,
    };
  } catch (error) {
    console.error('Error getting user statistics:', error);
    throw error;
  }
}

/**
 * Ban/suspend user
 */
export async function banUser(userId, reason) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'banned',
      bannedAt: new Date(),
      banReason: reason,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error banning user:', error);
    throw error;
  }
}

/**
 * Unban/activate user
 */
export async function unbanUser(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      status: 'active',
      bannedAt: null,
      banReason: null,
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error unbanning user:', error);
    throw error;
  }
}

/**
 * Get all reports
 */
export async function getAllReports({ page = 1, pageSize = 20, status = 'all' }) {
  try {
    const reportsRef = collection(db, 'reports');
    let q = query(reportsRef, orderBy('createdAt', 'desc'));

    // Filter by status if specified
    if (status !== 'all') {
      q = query(reportsRef, where('status', '==', status), orderBy('createdAt', 'desc'));
    }

    const snapshot = await getDocs(q);
    const reports = [];

    snapshot.forEach((doc) => {
      reports.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Pagination
    const totalReports = reports.length;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedReports = reports.slice(start, end);

    return {
      reports: paginatedReports,
      totalReports,
      totalPages: Math.ceil(totalReports / pageSize),
      currentPage: page,
    };
  } catch (error) {
    console.error('Error getting reports:', error);
    throw error;
  }
}

/**
 * Update report status
 */
export async function updateReportStatus(reportId, status, adminNotes = '') {
  try {
    const reportRef = doc(db, 'reports', reportId);
    await updateDoc(reportRef, {
      status,
      adminNotes,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating report status:', error);
    throw error;
  }
}

/**
 * Delete content (message, community post, etc.)
 */
export async function deleteContent(contentType, contentId, parentId = null) {
  try {
    let contentRef;

    switch (contentType) {
      case 'message':
        // Chat message
        if (!parentId) throw new Error('Parent chat ID required for messages');
        contentRef = doc(db, 'chats', parentId, 'messages', contentId);
        break;

      case 'community_message':
        // Community channel message
        if (!parentId) throw new Error('Parent info required');
        const [communityId, channelId] = parentId.split('/');
        contentRef = doc(
          db,
          'communities',
          communityId,
          'channels',
          channelId,
          'messages',
          contentId
        );
        break;

      case 'community':
        contentRef = doc(db, 'communities', contentId);
        break;

      case 'event':
        contentRef = doc(db, 'events', contentId);
        break;

      case 'file':
        contentRef = doc(db, 'files', contentId);
        break;

      default:
        throw new Error(`Unknown content type: ${contentType}`);
    }

    await updateDoc(contentRef, {
      deleted: true,
      deletedAt: new Date(),
      deletedBy: 'admin',
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting content:', error);
    throw error;
  }
}

/**
 * Get platform analytics
 */
export async function getPlatformAnalytics() {
  try {
    const [userStats, contentStats] = await Promise.all([
      getUserStatistics(),
      getContentStatistics(),
    ]);

    return {
      users: userStats,
      content: contentStats,
    };
  } catch (error) {
    console.error('Error getting platform analytics:', error);
    throw error;
  }
}

/**
 * Get content statistics
 */
async function getContentStatistics() {
  try {
    const [communitiesSnap, eventsSnap, filesSnap, reportsSnap] = await Promise.all([
      getDocs(collection(db, 'communities')),
      getDocs(collection(db, 'events')),
      getDocs(collection(db, 'files')),
      getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'))),
    ]);

    return {
      totalCommunities: communitiesSnap.size,
      totalEvents: eventsSnap.size,
      totalFiles: filesSnap.size,
      pendingReports: reportsSnap.size,
    };
  } catch (error) {
    console.error('Error getting content statistics:', error);
    return {
      totalCommunities: 0,
      totalEvents: 0,
      totalFiles: 0,
      pendingReports: 0,
    };
  }
}

/**
 * Get recent activity logs
 */
export async function getRecentActivity({ limit: activityLimit = 50 }) {
  try {
    // This is a simplified version. In production, you'd have a dedicated activity log collection
    const usersRef = collection(db, 'users');
    const q = query(usersRef, orderBy('createdAt', 'desc'), limit(activityLimit));

    const snapshot = await getDocs(q);
    const activities = [];

    snapshot.forEach((doc) => {
      const user = doc.data();
      activities.push({
        id: doc.id,
        type: 'user_joined',
        userId: doc.id,
        userName: user.displayName,
        timestamp: user.createdAt,
      });
    });

    return activities;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
}
