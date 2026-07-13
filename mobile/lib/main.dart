import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'core/auth_provider.dart';
import 'core/station_provider.dart';
import 'core/theme.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_shell.dart';

void main() {
  runApp(const DmsWashControlApp());
}

class DmsWashControlApp extends StatelessWidget {
  const DmsWashControlApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..restoreSession()),
        ChangeNotifierProvider(create: (_) => StationProvider()),
      ],
      child: MaterialApp(
        title: 'DMS WashControl',
        debugShowCheckedModeBanner: false,
        theme: appTheme,
        home: const _RootRouter(),
      ),
    );
  }
}

class _RootRouter extends StatelessWidget {
  const _RootRouter();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    if (auth.loading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return auth.isAuthenticated ? const HomeShell() : const LoginScreen();
  }
}
