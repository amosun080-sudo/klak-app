# Klak Mobile — Production Deployment Guide

## Pre-deployment Checklist

### 1. Environment Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Set production API URL in `EXPO_PUBLIC_API_BASE_URL`
- [ ] Configure Mono Connect production public key
- [ ] Update Google OAuth client ID (if using)
- [ ] Set `EXPO_PUBLIC_APP_ENV=production`

### 2. App Configuration
- [ ] Update app version in `package.json` and `app.config.ts`
- [ ] Set correct bundle identifiers for iOS and Android
- [ ] Configure app icons and splash screens
- [ ] Update app store metadata (name, description, keywords)

### 3. EAS Project Setup
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Initialize EAS project (if not done)
eas init

# Configure project ID in app.config.ts
```

### 4. Code Quality Checks
```bash
# Run type checking
npm run typecheck

# Run linting
npm run lint:check

# Fix any issues
npm run lint
```

## Production Builds

### Android Build
```bash
# Build for Google Play Store
eas build --platform android --profile production

# Check build status
eas build:list
```

### iOS Build  
```bash
# Build for App Store
eas build --platform ios --profile production

# Check build status
eas build:list
```

### Build Both Platforms
```bash
eas build --platform all --profile production
```

## Store Submission

### Android (Google Play Store)
```bash
# Submit to Google Play Store
eas submit --platform android

# Or manually upload the APK/AAB from EAS builds
```

### iOS (App Store)
```bash  
# Submit to App Store
eas submit --platform ios

# Or manually upload via Xcode/App Store Connect
```

## Production Monitoring

### Error Tracking
- [ ] Set up Sentry or similar error tracking service
- [ ] Replace TODO comments in `src/lib/errorReporter.ts`
- [ ] Configure error reporting SDK in app initialization

### Analytics
- [ ] Configure Firebase Analytics or similar
- [ ] Track key user events (login, account linking, transactions)
- [ ] Set up conversion funnels and retention metrics

### Performance Monitoring
- [ ] Enable Flipper or React Native performance monitoring
- [ ] Monitor app startup time and API response times
- [ ] Track memory usage and crashes

## Security Checklist

### API Security
- [ ] Ensure production API uses HTTPS
- [ ] Validate JWT token expiration and refresh logic
- [ ] Implement proper rate limiting on backend
- [ ] Review API error messages for information leakage

### Mobile Security
- [ ] Enable certificate pinning for API calls
- [ ] Obfuscate sensitive code sections
- [ ] Validate all user inputs
- [ ] Implement biometric authentication for sensitive actions

### Data Protection
- [ ] Review data storage (ensure PII is encrypted)
- [ ] Implement proper session management
- [ ] Configure secure storage (Keychain/Keystore)
- [ ] Add network security policies

## Post-deployment

### Monitoring
- Monitor app store reviews and ratings
- Track crash reports and fix critical issues
- Monitor API performance and error rates
- Review user feedback and feature requests

### Updates
- Use EAS Update for quick fixes and content updates
- Follow semantic versioning for app releases
- Test updates thoroughly before deployment
- Maintain backward compatibility with older app versions

## Troubleshooting

### Common Build Issues
1. **Missing environment variables**: Check `.env.local` is properly configured
2. **Build failures**: Run `expo doctor` to check for issues
3. **Certificate issues**: Ensure iOS certificates are valid and properly configured
4. **Asset issues**: Verify all required assets (icons, splash) are present

### Runtime Issues
1. **API connectivity**: Check network permissions and base URL
2. **Authentication failures**: Verify JWT configuration and refresh logic
3. **Storage issues**: Check SecureStore permissions and fallbacks
4. **Navigation errors**: Ensure all routes are properly defined

## Support

For deployment support:
- Check [Expo documentation](https://docs.expo.dev/)
- Review [EAS Build documentation](https://docs.expo.dev/build/introduction/)
- Contact development team for custom deployment issues