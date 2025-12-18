import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  IconButton,
  Menu,
  Divider,
  Chip,
  ActivityIndicator,
  Dialog,
  Portal,
  TextInput,
} from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../store/authStore';
import {
  getAllReports,
  updateReportStatus,
  deleteContent,
  banUser,
  isAdmin,
} from '../../services/adminService';
import { formatDistanceToNow } from 'date-fns';
import { COLORS } from '../../constants/theme';

export default function ReportsManagement() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalReports, setTotalReports] = useState(0);
  const [selectedReport, setSelectedReport] = useState(null);
  const [menuVisible, setMenuVisible] = useState(null);
  const [actionDialogVisible, setActionDialogVisible] = useState(false);
  const [actionType, setActionType] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, [user?.uid]);

  useEffect(() => {
    loadReports();
  }, [currentPage, filterStatus]);

  const checkAdminAccess = async () => {
    if (!user?.uid) {
      router.replace('/');
      return;
    }

    const adminStatus = await isAdmin(user.uid);
    if (!adminStatus) {
      Alert.alert('Access Denied', 'You do not have admin privileges.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const result = await getAllReports({
        page: currentPage,
        pageSize: 20,
        status: filterStatus,
      });

      setReports(result.reports);
      setTotalPages(result.totalPages);
      setTotalReports(result.totalReports);
    } catch (error) {
      console.error('Error loading reports:', error);
      Alert.alert('Error', 'Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReport = async (report) => {
    setSelectedReport(report);
    setActionType('approve');
    setActionDialogVisible(true);
  };

  const handleRejectReport = async (report) => {
    setSelectedReport(report);
    setActionType('reject');
    setActionDialogVisible(true);
  };

  const handleDeleteContent = async (report) => {
    Alert.alert(
      'Delete Content',
      'Are you sure you want to delete this reported content? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await deleteContent(
                report.contentType,
                report.contentId,
                report.parentId
              );

              await updateReportStatus(report.id, 'resolved', 'Content deleted by admin');
              Alert.alert('Success', 'Content has been deleted.');
              loadReports();
            } catch (error) {
              console.error('Error deleting content:', error);
              Alert.alert('Error', 'Failed to delete content.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const handleBanReportedUser = async (report) => {
    if (!report.reportedUserId) {
      Alert.alert('Error', 'No user ID found in this report.');
      return;
    }

    Alert.alert(
      'Ban User',
      'Do you want to ban the user who created this content?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            setProcessing(true);
            try {
              await banUser(report.reportedUserId, `Banned due to report: ${report.reason}`);
              await updateReportStatus(report.id, 'resolved', 'User banned');
              Alert.alert('Success', 'User has been banned.');
              loadReports();
            } catch (error) {
              console.error('Error banning user:', error);
              Alert.alert('Error', 'Failed to ban user.');
            } finally {
              setProcessing(false);
            }
          },
        },
      ]
    );
  };

  const executeAction = async () => {
    if (!selectedReport) return;

    setProcessing(true);
    try {
      const status = actionType === 'approve' ? 'resolved' : 'dismissed';
      await updateReportStatus(selectedReport.id, status, adminNotes);

      Alert.alert(
        'Success',
        `Report has been ${actionType === 'approve' ? 'approved' : 'rejected'}.`
      );

      setActionDialogVisible(false);
      setAdminNotes('');
      setSelectedReport(null);
      loadReports();
    } catch (error) {
      console.error('Error processing report:', error);
      Alert.alert('Error', 'Failed to process report.');
    } finally {
      setProcessing(false);
    }
  };

  const getReportTypeIcon = (type) => {
    const icons = {
      spam: 'alert-octagon',
      harassment: 'account-alert',
      inappropriate: 'alert',
      hate_speech: 'alert-circle',
      violence: 'shield-alert',
      other: 'flag',
    };
    return icons[type] || 'flag';
  };

  const getReportTypeColor = (type) => {
    const colors = {
      spam: '#F59E0B',
      harassment: '#EF4444',
      inappropriate: '#F97316',
      hate_speech: '#DC2626',
      violence: '#991B1B',
      other: '#6B7280',
    };
    return colors[type] || COLORS.textSecondary;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return COLORS.warning;
      case 'resolved':
        return COLORS.success;
      case 'dismissed':
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const renderReport = ({ item }) => {
    const reportedAgo = item.createdAt
      ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true })
      : 'Unknown';

    return (
      <Card style={styles.reportCard}>
        <Card.Content>
          <View style={styles.reportHeader}>
            <Avatar.Icon
              size={40}
              icon={getReportTypeIcon(item.type)}
              style={[
                styles.typeIcon,
                { backgroundColor: getReportTypeColor(item.type) },
              ]}
            />
            <View style={styles.reportInfo}>
              <View style={styles.titleRow}>
                <Text variant="titleMedium" style={styles.reportType}>
                  {item.type?.replace('_', ' ').toUpperCase()}
                </Text>
                <Chip
                  style={[
                    styles.statusChip,
                    { backgroundColor: getStatusColor(item.status) },
                  ]}
                  textStyle={styles.statusChipText}
                >
                  {item.status || 'pending'}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.reportTime}>
                Reported {reportedAgo}
              </Text>
            </View>
            {item.status === 'pending' && (
              <Menu
                visible={menuVisible === item.id}
                onDismiss={() => setMenuVisible(null)}
                anchor={
                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(item.id)}
                  />
                }
              >
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleApproveReport(item);
                  }}
                  title="Approve Report"
                  leadingIcon="check"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleRejectReport(item);
                  }}
                  title="Reject Report"
                  leadingIcon="close"
                />
                <Divider />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleDeleteContent(item);
                  }}
                  title="Delete Content"
                  leadingIcon="delete"
                />
                <Menu.Item
                  onPress={() => {
                    setMenuVisible(null);
                    handleBanReportedUser(item);
                  }}
                  title="Ban User"
                  leadingIcon="account-cancel"
                />
              </Menu>
            )}
          </View>

          <View style={styles.reportDetails}>
            <Text variant="bodyMedium" style={styles.reasonLabel}>
              Reason:
            </Text>
            <Text variant="bodyMedium" style={styles.reasonText}>
              {item.reason || 'No reason provided'}
            </Text>

            {item.description && (
              <>
                <Text variant="bodyMedium" style={[styles.reasonLabel, { marginTop: 8 }]}>
                  Description:
                </Text>
                <Text variant="bodySmall" style={styles.descriptionText}>
                  {item.description}
                </Text>
              </>
            )}

            <View style={styles.metadata}>
              {item.reportedBy && (
                <Text variant="bodySmall" style={styles.metaText}>
                  Reporter ID: {item.reportedBy.substring(0, 8)}...
                </Text>
              )}
              {item.reportedUserId && (
                <Text variant="bodySmall" style={styles.metaText}>
                  Reported User: {item.reportedUserId.substring(0, 8)}...
                </Text>
              )}
              {item.contentType && (
                <Text variant="bodySmall" style={styles.metaText}>
                  Content Type: {item.contentType}
                </Text>
              )}
            </View>

            {item.adminNotes && (
              <View style={styles.adminNotesContainer}>
                <Text variant="bodySmall" style={styles.adminNotesLabel}>
                  Admin Notes:
                </Text>
                <Text variant="bodySmall" style={styles.adminNotesText}>
                  {item.adminNotes}
                </Text>
              </View>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Avatar.Icon size={80} icon="flag-checkered" style={styles.emptyIcon} />
      <Text variant="titleLarge" style={styles.emptyTitle}>
        No Reports Found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {filterStatus === 'pending'
          ? "Great! There are no pending reports to review."
          : `No ${filterStatus} reports at this time.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <IconButton icon="arrow-left" onPress={() => router.back()} />
          <View style={styles.headerContent}>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Reports & Moderation
            </Text>
            <Text variant="bodyMedium" style={styles.headerSubtitle}>
              {totalReports} total reports
            </Text>
          </View>
        </View>

        <View style={styles.filters}>
          <Chip
            selected={filterStatus === 'pending'}
            onPress={() => setFilterStatus('pending')}
            style={styles.filterChip}
            icon="clock-outline"
          >
            Pending
          </Chip>
          <Chip
            selected={filterStatus === 'resolved'}
            onPress={() => setFilterStatus('resolved')}
            style={styles.filterChip}
            icon="check"
          >
            Resolved
          </Chip>
          <Chip
            selected={filterStatus === 'dismissed'}
            onPress={() => setFilterStatus('dismissed')}
            style={styles.filterChip}
            icon="close"
          >
            Dismissed
          </Chip>
          <Chip
            selected={filterStatus === 'all'}
            onPress={() => setFilterStatus('all')}
            style={styles.filterChip}
          >
            All
          </Chip>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <>
          <FlatList
            data={reports}
            renderItem={renderReport}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[
              styles.listContent,
              reports.length === 0 && styles.emptyList,
            ]}
            ListEmptyComponent={renderEmpty}
          />

          {totalPages > 1 && (
            <View style={styles.pagination}>
              <Button
                mode="outlined"
                onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <Text variant="bodyMedium" style={styles.pageInfo}>
                Page {currentPage} of {totalPages}
              </Text>
              <Button
                mode="outlined"
                onPress={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </View>
          )}
        </>
      )}

      {/* Action Dialog */}
      <Portal>
        <Dialog
          visible={actionDialogVisible}
          onDismiss={() => {
            setActionDialogVisible(false);
            setAdminNotes('');
            setSelectedReport(null);
          }}
        >
          <Dialog.Title>
            {actionType === 'approve' ? 'Approve Report' : 'Reject Report'}
          </Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.dialogText}>
              {actionType === 'approve'
                ? 'Approving this report will mark it as resolved. You can add notes about the action taken.'
                : 'Rejecting this report will dismiss it as invalid or not requiring action.'}
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Add admin notes (optional)"
              value={adminNotes}
              onChangeText={setAdminNotes}
              multiline
              numberOfLines={3}
              style={styles.notesInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setActionDialogVisible(false);
                setAdminNotes('');
                setSelectedReport(null);
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onPress={executeAction}
              loading={processing}
              disabled={processing}
            >
              {actionType === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: COLORS.white,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
  },
  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  filterChip: {
    height: 32,
  },
  listContent: {
    padding: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  reportCard: {
    marginBottom: 12,
    backgroundColor: COLORS.white,
    elevation: 2,
  },
  reportHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  typeIcon: {
    marginRight: 12,
  },
  reportInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  reportType: {
    fontWeight: 'bold',
    flex: 1,
  },
  statusChip: {
    height: 24,
    marginLeft: 8,
  },
  statusChipText: {
    fontSize: 10,
    color: COLORS.white,
  },
  reportTime: {
    color: COLORS.textSecondary,
  },
  reportDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  reasonLabel: {
    fontWeight: '600',
    marginBottom: 4,
  },
  reasonText: {
    marginBottom: 8,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  adminNotesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.lightPrimary,
    borderRadius: 8,
  },
  adminNotesLabel: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  adminNotesText: {
    color: COLORS.primary,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
  },
  pageInfo: {
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    backgroundColor: COLORS.lightGray,
    marginBottom: 16,
  },
  emptyTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: COLORS.textSecondary,
  },
  dialogText: {
    marginBottom: 16,
  },
  notesInput: {
    marginTop: 8,
  },
});
