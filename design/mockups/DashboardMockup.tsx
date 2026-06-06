import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  Easing,
  FadeIn,
  SlideInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const PADDING = 20;
const CARD_WIDTH = width - PADDING * 2;

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type Transaction = {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  type: 'debit' | 'credit';
  timestamp: string;
  icon: string;
};

type PortfolioDataPoint = {
  month: string;
  value: number;
};

const COLORS = {
  bg: '#05070A',
  bgSecondary: '#0F1720',
  border: 'rgba(255,255,255,0.06)',
  text: '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.55)',
  gold: '#D4AF37',
  emerald: '#34D399',
  red: '#F87171',
  glass: 'rgba(255,255,255,0.04)',
} as const;

// ============================================================================
// REUSABLE COMPONENTS
// ============================================================================

interface GlassmorphicCardProps {
  children: React.ReactNode;
  style?: any;
  animated?: boolean;
  delay?: number;
}

const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
  children,
  style,
  animated = false,
  delay = 0,
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);

  useEffect(() => {
    if (animated) {
      opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
      translateY.value = withDelay(delay, withSpring(0, { damping: 18, stiffness: 120 }));
    } else {
      opacity.value = 1;
      translateY.value = 0;
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const content = (
    <View style={[styles.glassmorphic, style]}>
      {children}
    </View>
  );

  return animated ? (
    <Animated.View style={animatedStyle}>{content}</Animated.View>
  ) : (
    content
  );
};

interface ActionButtonProps {
  icon: string;
  label: string;
  onPress?: () => void;
  color?: string;
}

const ActionButton: React.FC<ActionButtonProps> = ({ icon, label, onPress, color = COLORS.emerald }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionButton, { borderColor: color }]}>
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.actionIconText, { color }]}>{icon}</Text>
      </View>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
  </TouchableOpacity>
);

interface StatCardProps {
  label: string;
  value: string;
  trend?: number;
  color?: string;
  icon?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, trend, color = COLORS.gold, icon }) => (
  <View style={[styles.statCard, { borderColor: `${color}20` }]}>
    <View style={styles.statCardHeader}>
      {icon && <Text style={styles.statCardIcon}>{icon}</Text>}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    {trend !== undefined && (
      <Text style={[styles.statTrend, { color: trend >= 0 ? COLORS.emerald : COLORS.red }]}>
        {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </Text>
    )}
  </View>
);

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => (
  <TouchableOpacity activeOpacity={0.6}>
    <View style={styles.transactionCard}>
      <View style={styles.transactionLeft}>
        <View style={styles.transactionIcon}>
          <Text style={styles.transactionIconText}>{transaction.icon}</Text>
        </View>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionMerchant}>{transaction.merchant}</Text>
          <Text style={styles.transactionCategory}>{transaction.category}</Text>
        </View>
      </View>
      <View style={styles.transactionRight}>
        <Text
          style={[
            styles.transactionAmount,
            { color: transaction.type === 'credit' ? COLORS.emerald : COLORS.text },
          ]}
        >
          {transaction.type === 'credit' ? '+' : '-'}₦{Math.abs(transaction.amount).toLocaleString()}
        </Text>
        <Text style={styles.transactionTime}>{transaction.timestamp}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

// ============================================================================
// PORTFOLIO CHART
// ============================================================================

interface PortfolioChartProps {
  data: PortfolioDataPoint[];
}

const PortfolioChart: React.FC<PortfolioChartProps> = ({ data }) => {
  const chartWidth = CARD_WIDTH - 40;
  const chartHeight = 180;
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  // Generate SVG path for smooth curve
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * chartWidth;
    const y = chartHeight - ((d.value - minValue) / range) * (chartHeight - 40);
    return { x, y };
  });

  const generatePath = () => {
    if (points.length < 2) return '';
    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = (points[i - 1].x + points[i].x) / 2;
      const cp1y = points[i - 1].y;
      const cp2x = (points[i - 1].x + points[i].x) / 2;
      const cp2y = points[i].y;
      path += ` C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${points[i].x} ${points[i].y}`;
    }
    return path;
  };

  const animationProgress = useSharedValue(0);

  useEffect(() => {
    animationProgress.value = withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: animationProgress.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <View style={styles.chartContainer}>
        <View style={styles.chartAxis}>
          {data.map((d, i) => (
            <View key={i} style={styles.chartBarContainer}>
              <View
                style={[
                  styles.chartBar,
                  {
                    height: `${((d.value - minValue) / range) * 100}%`,
                  },
                ]}
              />
              <Text style={styles.chartLabel}>{d.month}</Text>
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

// ============================================================================
// MAIN DASHBOARD COMPONENT
// ============================================================================

export default function LuxuryFintech() {
  const balanceValue = 2_847_520.50;
  const monthlyGrowth = 12.4;
  const portfolioPerformance = 8.7;

  const portfolioData: PortfolioDataPoint[] = [
    { month: 'Jan', value: 2_450_000 },
    { month: 'Feb', value: 2_580_000 },
    { month: 'Mar', value: 2_520_000 },
    { month: 'Apr', value: 2_720_000 },
    { month: 'May', value: 2_890_000 },
    { month: 'Jun', value: 2_847_520 },
  ];

  const transactions: Transaction[] = [
    {
      id: '1',
      merchant: 'Apple Store',
      category: 'Technology',
      amount: -89_500,
      type: 'debit',
      timestamp: 'Today',
      icon: '🍎',
    },
    {
      id: '2',
      merchant: 'Salary Deposit',
      category: 'Income',
      amount: 450_000,
      type: 'credit',
      timestamp: 'Yesterday',
      icon: '💰',
    },
    {
      id: '3',
      merchant: 'Netflix Subscription',
      category: 'Entertainment',
      amount: -2_900,
      type: 'debit',
      timestamp: '2 days ago',
      icon: '🎬',
    },
    {
      id: '4',
      merchant: 'Investment Portfolio',
      category: 'Investments',
      amount: 150_000,
      type: 'credit',
      timestamp: '3 days ago',
      icon: '📈',
    },
    {
      id: '5',
      merchant: 'Restaurant Lagos',
      category: 'Dining',
      amount: -28_500,
      type: 'debit',
      timestamp: '4 days ago',
      icon: '🍽️',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Good morning,</Text>
              <Text style={styles.userName}>General Godwin</Text>
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity activeOpacity={0.6}>
                <View style={styles.avatar} />
              </TouchableOpacity>
              <TouchableOpacity activeOpacity={0.6}>
                <View style={styles.notificationBell}>
                  <Text style={styles.notificationDot}>●</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* HERO BALANCE CARD */}
        <View style={styles.heroSection}>
          <LinearGradient
            colors={['rgba(212,175,55,0.12)', 'rgba(212,175,55,0.04)', 'rgba(52,211,153,0.06)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroGradient}
          >
            <GlassmorphicCard animated delay={0}>
              <View style={styles.cardTopSection}>
                <View>
                  <Text style={styles.balanceLabel}>Total Wealth</Text>
                  <Text style={styles.balanceAmount}>₦{balanceValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}</Text>
                </View>
                <View style={styles.performanceBadge}>
                  <Text style={styles.performanceIcon}>📊</Text>
                  <View>
                    <Text style={styles.performanceLabel}>Performance</Text>
                    <Text style={[styles.performanceValue, { color: COLORS.emerald }]}>
                      +{portfolioPerformance}%
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardBottomSection}>
                <View style={styles.growthMetric}>
                  <View>
                    <Text style={styles.metricLabel}>Monthly Growth</Text>
                    <Text style={[styles.metricValue, { color: COLORS.emerald }]}>+{monthlyGrowth}%</Text>
                  </View>
                </View>
                <View style={styles.growthMetric}>
                  <View>
                    <Text style={styles.metricLabel}>Available Balance</Text>
                    <Text style={[styles.metricValue, { color: COLORS.gold }]}>₦742,850</Text>
                  </View>
                </View>
              </View>
            </GlassmorphicCard>
          </LinearGradient>
        </View>

        {/* QUICK ACTIONS */}
        <GlassmorphicCard animated delay={100}>
          <View style={styles.actionsGrid}>
            <ActionButton icon="💸" label="Transfer" color={COLORS.emerald} />
            <ActionButton icon="📈" label="Invest" color={COLORS.gold} />
            <ActionButton icon="💼" label="Budget" color="#6366F1" />
            <ActionButton icon="📊" label="Analytics" color="#EC4899" />
          </View>
        </GlassmorphicCard>

        {/* PORTFOLIO PERFORMANCE */}
        <GlassmorphicCard animated delay={200}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Portfolio Performance</Text>
              <Text style={styles.sectionSubtitle}>6-month trend</Text>
            </View>
            <Text style={styles.sectionBadge}>↑ 12% YTD</Text>
          </View>
          <PortfolioChart data={portfolioData} />
        </GlassmorphicCard>

        {/* FINANCIAL OVERVIEW GRID */}
        <GlassmorphicCard animated delay={300}>
        <Text style={[styles.sectionTitle, { marginBottom: 16 }]}>            Financial Overview
          </Text>
          <View style={styles.statsGrid}>
            <StatCard
              label="Net Worth"
              value="₦2.85M"
              trend={12.4}
              color={COLORS.gold}
              icon="💎"
            />
            <StatCard
              label="Cash Flow"
              value="₦450K"
              trend={8.2}
              color={COLORS.emerald}
              icon="💰"
            />
            <StatCard
              label="Investment Yield"
              value="8.7%"
              trend={2.1}
              color="#6366F1"
              icon="📈"
            />
            <StatCard
              label="Savings Rate"
              value="42%"
              trend={-1.2}
              color="#EC4899"
              icon="🎯"
            />
          </View>
        </GlassmorphicCard>

        {/* RECENT ACTIVITY */}
        <GlassmorphicCard animated delay={400}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity activeOpacity={0.6}>
              <Text style={styles.viewAllButton}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.transactionList}>
            {transactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </View>
        </GlassmorphicCard>

        {/* BOTTOM SAFE AREA */}
        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollView: {
    flex: 1,
  },
  glassmorphic: {
    backgroundColor: COLORS.glass,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 24,
    marginHorizontal: PADDING,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.35,
    shadowRadius: 32,
    elevation: 8,
  },

  // HEADER
  header: {
    paddingHorizontal: PADDING,
    paddingVertical: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  userName: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  notificationBell: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    color: COLORS.emerald,
    fontSize: 10,
    fontWeight: 'bold',
  },

  // HERO SECTION
  heroSection: {
    marginHorizontal: PADDING,
    marginBottom: 16,
    borderRadius: 24,
    overflow: 'hidden',
  },
  heroGradient: {
    paddingVertical: 1,
    paddingHorizontal: 1,
  },
  cardTopSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  balanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  balanceAmount: {
    color: COLORS.text,
    fontSize: 42,
    fontWeight: '900',
    marginTop: 8,
    letterSpacing: -1,
  },
  performanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: `${COLORS.emerald}15`,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: `${COLORS.emerald}30`,
  },
  performanceIcon: {
    fontSize: 24,
  },
  performanceLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: 20,
  },
  cardBottomSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  growthMetric: {
    flex: 1,
    backgroundColor: `${COLORS.gold}08`,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: `${COLORS.gold}15`,
  },
  metricLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 6,
  },

  // ACTIONS
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (CARD_WIDTH - 36) / 2,
    borderRadius: 18,
    borderWidth: 1.5,
    padding: 16,
    alignItems: 'center',
    backgroundColor: COLORS.bg,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionIconText: {
    fontSize: 24,
  },
  actionLabel: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },

  // PORTFOLIO CHART
  chartContainer: {
    marginTop: 20,
    height: 220,
  },
  chartAxis: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: 8,
    paddingHorizontal: 8,
  },
  chartBarContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '80%',
    backgroundColor: COLORS.gold,
    borderRadius: 8,
    minHeight: 8,
    marginBottom: 12,
  },
  chartLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginTop: 8,
  },

  // SECTIONS
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  sectionBadge: {
    color: COLORS.emerald,
    fontSize: 12,
    fontWeight: '700',
    backgroundColor: `${COLORS.emerald}15`,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
  },

  // STATS GRID
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: (CARD_WIDTH - 36) / 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    backgroundColor: `${COLORS.gold}05`,
  },
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  statCardIcon: {
    fontSize: 18,
  },
  statLabel: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 8,
  },
  statTrend: {
    fontSize: 11,
    fontWeight: '700',
  },

  // TRANSACTIONS
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  viewAllButton: {
    color: COLORS.gold,
    fontSize: 13,
    fontWeight: '700',
  },
  transactionList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: `${COLORS.gold}04`,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.glass,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  transactionIconText: {
    fontSize: 20,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionMerchant: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
  transactionCategory: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  transactionTime: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});