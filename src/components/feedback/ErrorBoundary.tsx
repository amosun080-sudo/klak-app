/**
 * Error Boundary — Issue #4 from code review.
 * Catches unhandled React render errors and shows a recovery UI.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { typography, spacing, radius } from '../../theme/index';
import { errorReporter } from '../../lib/errorReporter';

interface Props {
  children: React.ReactNode;
  onError?: (error: Error) => void;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.props.onError?.(error);
    errorReporter.captureException(error, {
      severity: 'high',
      metadata: { componentStack: errorInfo.componentStack ?? '' },
    });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <View style={s.container}>
          <View style={s.iconWrap}>
            <Text style={s.icon}>⚠️</Text>
          </View>
          <Text style={s.title}>Something went wrong</Text>
          <Text style={s.message}>
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </Text>
          <TouchableOpacity
            style={s.btn}
            onPress={() => this.setState({ hasError: false, error: null })}
            activeOpacity={0.8}
          >
            <Text style={s.btnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[8],
    gap: spacing[4],
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: radius.full,
    backgroundColor: colors.alertRedDim,
    borderWidth: 1,
    borderColor: colors.alertRed + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  icon: { fontSize: 36 },
  title: {
    fontFamily: typography.family.extrabold,
    fontSize: typography.size.xl,
    color: colors.white,
    textAlign: 'center',
  },
  message: {
    fontFamily: typography.family.regular,
    fontSize: typography.size.sm,
    color: colors.textSec,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
  },
  btn: {
    backgroundColor: colors.klakGreen,
    borderRadius: radius.full,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    marginTop: spacing[4],
  },
  btnText: {
    fontFamily: typography.family.bold,
    fontSize: typography.size.base,
    color: colors.background,
  },
});
