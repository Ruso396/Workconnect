import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Footer from './components/Footer';
import GoBackHeader from './components/GoBackHeader';
import Header from './components/Header';
import AddWorkerScreen from './screens/AddWorkerScreen';
import AddProjectWorkersScreen from './screens/AddProjectWorkersScreen';
import AttendanceMarkScreen from './screens/AttendanceMarkScreen';
import AttendanceMarkFormScreen from './screens/AttendanceMarkFormScreen';
import CreateProjectScreen from './screens/CreateProjectScreen';
import ManageRolesScreen from './screens/ManageRolesScreen';
import ContractorNotificationsScreen from './screens/ContractorNotificationsScreen';
import LoginScreen from './screens/LoginScreen';
import ContractorHomeScreen from './screens/ContractorHomeScreen';
import ProjectDetailScreen from './screens/ProjectDetailScreen';
import ProjectListScreen from './screens/ProjectListScreen';
import SendJobScreen from './screens/SendJobScreen';
import WorkerHomeScreen from './screens/WorkerHomeScreen';
import WorkerAttendanceScreen from './screens/WorkerAttendanceScreen';
import WorkerNotificationsScreen from './screens/WorkerNotificationsScreen';
import WorkerProjectDetailScreen from './screens/WorkerProjectDetailScreen';
import WorkerProjectListScreen from './screens/WorkerProjectListScreen';
import WorkerListScreen from './screens/WorkerListScreen';
import ProfileScreen from './screens/ProfileScreen';
import { api, profileImageUri } from './services/api';
import {
  ContractorRole,
  JobRequest,
  Project,
  ProjectListItem,
  User,
  UserRole,
  Worker,
  WorkerStatus,
  WorkerTradeRole,
} from './types';

function projectToListItem(p: Project): ProjectListItem {
  return {
    id: p.id,
    contractor_id: p.contractor_id,
    name: p.name,
    location: p.location,
    start_date: p.start_date,
    end_date: p.end_date,
    description: p.description,
    status: p.status,
    created_at: p.created_at,
  };
}

type Tab = 'Home' | 'Workers' | 'Profile';
type ContractorScreen =
  | 'dashboard'
  | 'addWorker'
  | 'workerList'
  | 'sendJob'
  | 'profile'
  | 'manageRoles'
  | 'notifications'
  | 'projectList'
  | 'createProject'
  | 'projectDetail'
  | 'editProject'
  | 'addProjectWorkers'
  | 'attendanceMark'
  | 'attendanceMarkForm';

/** Contractor screens shown as footer/tab roots — all others use GoBackHeader. */
const CONTRACTOR_FOOTER_SCREENS: ContractorScreen[] = ['dashboard', 'workerList', 'profile'];

const STORAGE_KEY_USER = 'user';

export default function App(): React.JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Home');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [jobs, setJobs] = useState<JobRequest[]>([]);
  const [roles, setRoles] = useState<ContractorRole[]>([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [workerRefreshing, setWorkerRefreshing] = useState(false);
  const [jobRefreshing, setJobRefreshing] = useState(false);
  const [contractorStack, setContractorStack] = useState<ContractorScreen[]>(['dashboard']);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [editProjectInitial, setEditProjectInitial] = useState<ProjectListItem | null>(null);
  const [workerNotificationOpen, setWorkerNotificationOpen] = useState(false);
  const [workerProjectListOpen, setWorkerProjectListOpen] = useState(false);
  const [workerSelectedProjectId, setWorkerSelectedProjectId] = useState<number | null>(null);
  const [workerAttendanceOpen, setWorkerAttendanceOpen] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState<string | null>(null);
  const [attendanceProjectId, setAttendanceProjectId] = useState<number | null>(null);
  const [attendanceRefreshKey, setAttendanceRefreshKey] = useState(0);

  const contractorTop: ContractorScreen = contractorStack[contractorStack.length - 1] ?? 'dashboard';

  const pushContractor = useCallback((screen: ContractorScreen) => {
    setContractorStack((s) => [...s, screen]);
  }, []);

  const replaceContractorRoot = useCallback((screen: ContractorScreen) => {
    setContractorStack([screen]);
  }, []);

  const popContractor = useCallback(() => {
    setContractorStack((s) => {
      if (s.length <= 1) {
        return s;
      }
      return s.slice(0, -1);
    });
  }, []);

  useEffect(() => {
    if (role !== 'contractor') {
      return;
    }
    if (contractorTop === 'editProject' && editProjectInitial == null) {
      popContractor();
    }
  }, [role, contractorTop, editProjectInitial, popContractor]);

  useEffect(() => {
    if (role !== 'contractor') {
      return;
    }
    if (contractorTop === 'projectDetail' && selectedProjectId == null) {
      popContractor();
    }
    if (contractorTop === 'addProjectWorkers' && selectedProjectId == null) {
      popContractor();
    }
  }, [role, contractorTop, selectedProjectId, popContractor]);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as User;
          setUser(parsed);
          setRole(parsed.role);
          setActiveTab('Home');
          setContractorStack(['dashboard']);
          setWorkerNotificationOpen(false);
          setWorkerProjectListOpen(false);
          setWorkerSelectedProjectId(null);
          if (parsed.role === 'contractor') {
            await fetchWorkers(parsed.id);
            await fetchRoles(parsed.id);
            await fetchNotificationCount(parsed.id);
          } else {
            await fetchJobs(parsed.id);
          }
        }
      } catch (e) {
        console.log('Error loading user', e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    if (user) {
      AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user)).catch((e) =>
        console.log('Error persisting user', e),
      );
    }
  }, [user]);

  const handleLogin = async (phone: string, password: string, role: UserRole) => {
    const user = await api.login(phone, password, role);
    setUser(user);
    setRole(user.role);
    setActiveTab('Home');
    setContractorStack(['dashboard']);
    setWorkerNotificationOpen(false);
    setWorkerProjectListOpen(false);
    setWorkerSelectedProjectId(null);
    await AsyncStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    if (user.role === 'contractor') {
      await fetchWorkers(user.id);
      await fetchRoles(user.id);
      await fetchNotificationCount(user.id);
    } else {
      await fetchJobs(user.id);
    }
    return user;
  };

  const fetchWorkers = async (contractorId?: number) => {
    const id = contractorId ?? user?.id;
    if (!id) {
      return;
    }
    setLoadingWorkers(true);
    try {
      const result = await api.getWorkers(id);
      setWorkers(result);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchRoles = async (contractorId?: number) => {
    const id = contractorId ?? user?.id;
    if (!id) {
      return;
    }
    try {
      const result = await api.getContractorRoles(id);
      setRoles(result);
    } catch (err) {
      console.log('Failed to fetch roles', err);
    }
  };

  const fetchNotificationCount = async (contractorId?: number) => {
    const id = contractorId ?? user?.id;
    if (!id) {
      return;
    }
    try {
      const result = await api.getContractorUnreadCount(id);
      setNotificationCount(result.count);
    } catch (err) {
      console.log('Failed to fetch notification count', err);
    }
  };

  // Refresh lists on foreground so contractor worker rows (names, locations, avatars) stay current.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState !== 'active' || !user) {
        return;
      }
      if (user.role === 'contractor') {
        void fetchWorkers(user.id);
        void fetchNotificationCount(user.id);
      } else {
        void fetchJobs(user.id);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [user]);

  // Keep notification badges fresh while the app is open (contractor: unread API; worker: pending jobs).
  useEffect(() => {
    if (!user) {
      return;
    }
    const id = setInterval(() => {
      if (user.role === 'contractor') {
        void fetchNotificationCount(user.id);
      } else {
        void fetchJobs(user.id, { silent: true });
      }
    }, 15000);
    return () => clearInterval(id);
  }, [user]);

  const fetchJobs = async (workerId?: number, options?: { silent?: boolean }) => {
    const id = workerId ?? user?.id;
    if (!id) {
      return;
    }
    const silent = options?.silent === true;
    if (!silent) {
      setLoadingJobs(true);
    }
    try {
      const result = await api.getJobs(id);
      setJobs(result);
    } catch (err) {
      if (silent) {
        console.log('Failed to refresh jobs', err);
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to fetch jobs');
      }
    } finally {
      if (!silent) {
        setLoadingJobs(false);
      }
    }
  };

  const refreshWorkers = async () => {
    if (!user) {
      return;
    }
    setWorkerRefreshing(true);
    await fetchWorkers(user.id);
    setWorkerRefreshing(false);
  };

  const refreshJobs = async () => {
    if (!user) {
      return;
    }
    setJobRefreshing(true);
    await fetchJobs(user.id);
    setJobRefreshing(false);
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem(STORAGE_KEY_USER);
    setUser(null);
    setRole(null);
    setActiveTab('Home');
    setContractorStack(['dashboard']);
    setWorkerNotificationOpen(false);
    setWorkerProjectListOpen(false);
    setWorkerSelectedProjectId(null);
    setWorkers([]);
    setJobs([]);
    setRoles([]);
    setNotificationCount(0);
  };

  const onAddWorker = async (
    name: string,
    phone: string,
    password: string,
    role: WorkerTradeRole,
    location: string,
  ) => {
    if (!user) {
      throw new Error('You must be logged in');
    }
    const worker = await api.addWorker(user.id, name, phone, password, role, location);
    await fetchWorkers(user.id);
    return worker;
  };

  const onSendJob = async (
    projectId: number,
    targetRole: WorkerTradeRole,
    location: string,
    salary: string,
    description: string,
  ) => {
    if (!user) {
      throw new Error('You must be logged in');
    }
    return api.sendJob(user.id, projectId, targetRole, location, salary, description);
  };

  const onToggleStatus = async () => {
    if (!user) {
      return;
    }
    const nextStatus: WorkerStatus = user.status === 'active' ? 'inactive' : 'active';
    try {
      await api.updateStatus(user.id, nextStatus);
      setUser({ ...user, status: nextStatus });
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const onJobAction = async (requestId: number, action: 'accepted' | 'rejected') => {
    if (!user) {
      return;
    }
    try {
      await api.updateJobRequestStatus(requestId, action);
      await fetchJobs(user.id);
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update request');
    }
  };

  const onFooterPress = (tab: Tab) => {
    setActiveTab(tab);
    if (role === 'worker') {
      setWorkerNotificationOpen(false);
      setWorkerAttendanceOpen(false);
      if (tab !== 'Home') {
        setWorkerProjectListOpen(false);
        setWorkerSelectedProjectId(null);
      }
    }
    if (role === 'contractor') {
      if (tab === 'Home') {
        replaceContractorRoot('dashboard');
      } else if (tab === 'Workers') {
        replaceContractorRoot('workerList');
        void fetchWorkers();
      } else if (tab === 'Profile') {
        replaceContractorRoot('profile');
      }
    }
  };

  const isContractorInnerPage =
    role === 'contractor' && !CONTRACTOR_FOOTER_SCREENS.includes(contractorTop);
  const isWorkerInnerPage = role === 'worker' && workerNotificationOpen;
  const isWorkerProjectInnerPage =
    role === 'worker' && (workerProjectListOpen || workerSelectedProjectId !== null);
  const isWorkerAttendancePage = role === 'worker' && workerAttendanceOpen;
  const showGoBackHeader =
    isContractorInnerPage || isWorkerInnerPage || isWorkerProjectInnerPage || isWorkerAttendancePage;

  const handleGoBack = useCallback(() => {
    if (role === 'worker') {
      if (workerAttendanceOpen) {
        setWorkerAttendanceOpen(false);
        return;
      }
      if (workerSelectedProjectId != null) {
        setWorkerSelectedProjectId(null);
        return;
      }
      if (workerProjectListOpen) {
        setWorkerProjectListOpen(false);
        return;
      }
      setWorkerNotificationOpen(false);
      return;
    }
    if (role === 'contractor') {
      popContractor();
    }
  }, [role, popContractor, workerProjectListOpen, workerSelectedProjectId, workerAttendanceOpen]);

  const renderContent = () => {
    if (!user || !role) {
      return null;
    }

    if (role === 'worker') {
      if (workerNotificationOpen) {
        return (
          <WorkerNotificationsScreen
            workerId={user.id}
            jobs={jobs}
            loading={loadingJobs}
            refreshing={jobRefreshing}
            onRefresh={refreshJobs}
            onJobAction={onJobAction}
            onAfterClearAll={() => {
              setJobs([]);
            }}
          />
        );
      }
      if (activeTab === 'Profile') {
        return <ProfileScreen user={user} onUserChange={setUser} />;
      }
      if (workerSelectedProjectId != null) {
        return <WorkerProjectDetailScreen workerId={user.id} projectId={workerSelectedProjectId} />;
      }
      if (workerProjectListOpen) {
        return (
          <WorkerProjectListScreen
            workerId={user.id}
            onOpenProject={(projectId) => setWorkerSelectedProjectId(projectId)}
          />
        );
      }
      if (workerAttendanceOpen) {
        return <WorkerAttendanceScreen workerId={user.id} />;
      }
      return (
        <WorkerHomeScreen
          status={user.status}
          onToggleStatus={onToggleStatus}
          onGoProjects={() => {
            setWorkerProjectListOpen(true);
            setWorkerSelectedProjectId(null);
          }}
          onGoAttendance={() => setWorkerAttendanceOpen(true)}
        />
      );
    }

    if (contractorTop === 'dashboard') {
      return (
        <ContractorHomeScreen
          onGoAddWorker={() => pushContractor('addWorker')}
          onGoSendJob={() => pushContractor('sendJob')}
          onGoManageRoles={() => pushContractor('manageRoles')}
          onGoProjects={() => pushContractor('projectList')}
          onGoAttendance={() => pushContractor('attendanceMark')}
        />
      );
    }

    if (contractorTop === 'workerList') {
      return (
        <WorkerListScreen
          workers={workers}
          roles={roles}
          loading={loadingWorkers}
          refreshing={workerRefreshing}
          onRefresh={refreshWorkers}
        />
      );
    }

    if (contractorTop === 'sendJob') {
      return (
        <SendJobScreen contractorId={user.id} roles={roles} onSendJob={onSendJob} />
      );
    }

    if (contractorTop === 'profile') {
      return <ProfileScreen user={user} onUserChange={setUser} />;
    }

    if (contractorTop === 'manageRoles') {
      return (
        <ManageRolesScreen
          roles={roles}
          onRefreshRoles={() => fetchRoles()}
          contractorId={user.id}
        />
      );
    }

    if (contractorTop === 'notifications') {
      return (
        <ContractorNotificationsScreen
          contractorId={user.id}
          onAfterMarkRead={() => {
            void fetchNotificationCount(user.id);
          }}
          onAfterClearAll={() => {
            void fetchNotificationCount(user.id);
          }}
        />
      );
    }

    if (contractorTop === 'projectList') {
      return (
        <ProjectListScreen
          contractorId={user.id}
          onCreateProject={() => pushContractor('createProject')}
          onOpenProject={(projectId) => {
            setSelectedProjectId(projectId);
            pushContractor('projectDetail');
          }}
          onEditProject={(p) => {
            setEditProjectInitial(p);
            pushContractor('editProject');
          }}
          onAfterListChange={() => {
            void fetchWorkers(user.id);
          }}
        />
      );
    }

    if (contractorTop === 'createProject') {
      return (
        <CreateProjectScreen
          contractorId={user.id}
          mode="create"
          onSaved={() => popContractor()}
        />
      );
    }

    if (contractorTop === 'editProject') {
      return (
        <CreateProjectScreen
          contractorId={user.id}
          mode="edit"
          initialProject={editProjectInitial}
          onSaved={() => {
            setEditProjectInitial(null);
            popContractor();
          }}
        />
      );
    }

    if (contractorTop === 'projectDetail' && selectedProjectId != null) {
      return (
        <ProjectDetailScreen
          contractorId={user.id}
          projectId={selectedProjectId}
          onAddWorkers={() => pushContractor('addProjectWorkers')}
          onEditNavigate={(p) => {
            setEditProjectInitial(projectToListItem(p));
            pushContractor('editProject');
          }}
          onProjectClosed={() => {
            void fetchWorkers(user.id);
          }}
        />
      );
    }

    if (contractorTop === 'addProjectWorkers' && selectedProjectId != null) {
      return (
        <AddProjectWorkersScreen
          contractorId={user.id}
          projectId={selectedProjectId}
          workers={workers}
          onDone={() => popContractor()}
        />
      );
    }

    if (contractorTop === 'attendanceMark') {
      return (
        <AttendanceMarkScreen
          contractorId={user.id}
          initialDate={attendanceDate ?? undefined}
          refreshKey={attendanceRefreshKey}
          onOpenForm={(pickedDate, pickedProjectId) => {
            setAttendanceDate(pickedDate);
            setAttendanceProjectId(pickedProjectId);
            pushContractor('attendanceMarkForm');
          }}
        />
      );
    }

    if (contractorTop === 'attendanceMarkForm') {
      return (
        <AttendanceMarkFormScreen
          contractorId={user.id}
          date={attendanceDate ?? new Date().toISOString().slice(0, 10)}
          initialProjectId={attendanceProjectId ?? undefined}
          onDone={(didSave) => {
            if (didSave) {
              setAttendanceRefreshKey((v) => v + 1);
            }
            popContractor();
          }}
        />
      );
    }

    return <AddWorkerScreen roles={roles} onAddWorker={onAddWorker} />;
  };

  if (loading) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  if (!user || !role) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.root}>
          <StatusBar barStyle="dark-content" />
          <LoginScreen onLogin={handleLogin} />
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        {showGoBackHeader ? (
          <GoBackHeader onPress={handleGoBack} />
        ) : (
          <Header
            name={user.name}
            role={role}
            profileImage={profileImageUri(user.profile_image ?? undefined)}
            onLogout={handleLogout}
            notificationCount={
              role === 'contractor'
                ? notificationCount
                : jobs.filter((j) => j.status === 'pending').length
            }
            onNotificationPress={
              role === 'contractor'
                ? () => {
                    pushContractor('notifications');
                  }
                : () => {
                    setWorkerNotificationOpen(true);
                    void fetchJobs(user.id);
                  }
            }
          />
        )}
        <View style={styles.content}>{renderContent()}</View>
        <Footer
          role={role}
          active={role === 'worker' && workerNotificationOpen ? null : activeTab}
          onTabPress={onFooterPress}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});