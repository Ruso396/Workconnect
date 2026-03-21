import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, AppState, SafeAreaView, StatusBar, StyleSheet, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import Footer from './components/Footer';
import GoBackHeader from './components/GoBackHeader';
import Header from './components/Header';
import AddWorkerScreen from './screens/AddWorkerScreen';
import ManageRolesScreen from './screens/ManageRolesScreen';
import ContractorNotificationsScreen from './screens/ContractorNotificationsScreen';
import LoginScreen from './screens/LoginScreen';
import ContractorHomeScreen from './screens/ContractorHomeScreen';
import SendJobScreen from './screens/SendJobScreen';
import WorkerHomeScreen from './screens/WorkerHomeScreen';
import WorkerNotificationsScreen from './screens/WorkerNotificationsScreen';
import WorkerListScreen from './screens/WorkerListScreen';
import ProfileScreen from './screens/ProfileScreen';
import { api, profileImageUri } from './services/api';
import { ContractorRole, JobRequest, User, UserRole, Worker, WorkerStatus, WorkerTradeRole } from './types';

type Tab = 'Home' | 'Workers' | 'Profile';
type ContractorScreen =
  | 'dashboard'
  | 'addWorker'
  | 'workerList'
  | 'sendJob'
  | 'profile'
  | 'manageRoles'
  | 'notifications';

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
  const [contractorScreen, setContractorScreen] = useState<ContractorScreen>('dashboard');
  const [workerNotificationOpen, setWorkerNotificationOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem(STORAGE_KEY_USER);
        if (storedUser) {
          const parsed = JSON.parse(storedUser) as User;
          setUser(parsed);
          setRole(parsed.role);
          setActiveTab('Home');
          setContractorScreen('dashboard');
          setWorkerNotificationOpen(false);
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
    setContractorScreen('dashboard');
    setWorkerNotificationOpen(false);
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
    setContractorScreen('dashboard');
    setWorkerNotificationOpen(false);
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
    title: string,
    targetRole: WorkerTradeRole,
    location: string,
    salary: string,
    description: string,
  ) => {
    if (!user) {
      throw new Error('You must be logged in');
    }
    return api.sendJob(user.id, title, targetRole, location, salary, description);
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
    }
    if (role === 'contractor') {
      if (tab === 'Home') {
        setContractorScreen('dashboard');
      } else if (tab === 'Workers') {
        setContractorScreen('workerList');
        void fetchWorkers();
      } else if (tab === 'Profile') {
        setContractorScreen('profile');
      }
    }
  };

  const isContractorInnerPage =
    role === 'contractor' && !CONTRACTOR_FOOTER_SCREENS.includes(contractorScreen);
  const isWorkerInnerPage = role === 'worker' && workerNotificationOpen;
  const showGoBackHeader = isContractorInnerPage || isWorkerInnerPage;

  const handleGoBack = useCallback(() => {
    if (role === 'worker') {
      setWorkerNotificationOpen(false);
      return;
    }
    if (role === 'contractor') {
      setContractorScreen('dashboard');
      setActiveTab('Home');
    }
  }, [role]);

  const renderContent = () => {
    if (!user || !role) {
      return null;
    }

    if (role === 'worker') {
      if (workerNotificationOpen) {
        return (
          <WorkerNotificationsScreen
            jobs={jobs}
            loading={loadingJobs}
            refreshing={jobRefreshing}
            onRefresh={refreshJobs}
            onJobAction={onJobAction}
          />
        );
      }
      if (activeTab === 'Profile') {
        return <ProfileScreen user={user} onUserChange={setUser} />;
      }
      return <WorkerHomeScreen status={user.status} onToggleStatus={onToggleStatus} />;
    }

    if (contractorScreen === 'dashboard') {
      return (
        <ContractorHomeScreen
          onGoAddWorker={() => setContractorScreen('addWorker')}
          onGoSendJob={() => setContractorScreen('sendJob')}
          onGoManageRoles={() => setContractorScreen('manageRoles')}
        />
      );
    }

    if (contractorScreen === 'workerList') {
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

    if (contractorScreen === 'sendJob') {
      return <SendJobScreen roles={roles} onSendJob={onSendJob} />;
    }

    if (contractorScreen === 'profile') {
      return <ProfileScreen user={user} onUserChange={setUser} />;
    }

    if (contractorScreen === 'manageRoles') {
      return (
        <ManageRolesScreen
          roles={roles}
          onRefreshRoles={() => fetchRoles()}
          contractorId={user.id}
        />
      );
    }

    if (contractorScreen === 'notifications') {
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

    return <AddWorkerScreen roles={roles} onAddWorker={onAddWorker} />;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user || !role) {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar barStyle="dark-content" />
        <LoginScreen onLogin={handleLogin} />
      </SafeAreaView>
    );
  }

  return (
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
                  setActiveTab('Home');
                  setContractorScreen('notifications');
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