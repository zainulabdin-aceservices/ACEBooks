// =============================================
// HOME DASHBOARD - Animated cards with gradient
// =============================================
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { AuthContext } from '../../store/AuthContext';
import { colors } from '../../theme/colors';
import api from '../../services/api';

export default function HomeScreen() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, count: 0 });
  const [recent, setRecent] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const res = await api.get('/transactions');
      const txns = res.data;

      // Calculate stats
      const total = txns.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      setStats({ total, count: txns.length });

      // Get the 5 most recent transactions
      setRecent(txns.slice(0, 5));
    } catch (e) {
      console.log('Dashboard fetch error', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Gradient Welcome Banner */}
      <Animated.View entering={FadeInDown.duration(500)}>
        <LinearGradient colors={colors.gradientOrange} style={styles.banner} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
          <Text style={styles.welcome}>Welcome back,</Text>
          <Text style={styles.name}>{user?.name || 'User'}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>{user?.role}</Text>
          </View>
        </LinearGradient>
      </Animated.View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <Animated.View style={styles.statCard} entering={FadeInRight.duration(400).delay(200)}>
          <Text style={styles.statValue}>Rs {stats.total.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Total Spent</Text>
        </Animated.View>
        <Animated.View style={styles.statCard} entering={FadeInRight.duration(400).delay(350)}>
          <Text style={styles.statValue}>{stats.count}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </Animated.View>
      </View>

      {/* Recent Activity */}
      <Animated.View entering={FadeInDown.duration(400).delay(500)}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        {recent.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No transactions yet. Tap &quot;Add Expense&quot; to get started!</Text>
          </View>
        ) : (
          recent.map((txn, index) => (
            <Animated.View key={txn.id} style={styles.txnCard} entering={FadeInDown.duration(300).delay(600 + index * 100)}>
              <View style={styles.txnRow}>
                <View>
                  <Text style={styles.txnDesc}>{txn.description || 'No description'}</Text>
                  <Text style={styles.txnMeta}>{txn.customer_name} • {new Date(txn.date).toLocaleDateString()}</Text>
                </View>
                <Text style={styles.txnAmount}>Rs {parseFloat(txn.amount).toLocaleString()}</Text>
              </View>
            </Animated.View>
          ))
        )}
      </Animated.View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    margin: 16,
    padding: 24,
    borderRadius: 20,
  },
  welcome: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  name: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginTop: 2,
  },
  roleBadge: {
    marginTop: 10,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 16,
  },
  txnCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txnDesc: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  txnMeta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 3,
  },
  txnAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.primary,
  },
  emptyCard: {
    backgroundColor: colors.card,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
  },
});
