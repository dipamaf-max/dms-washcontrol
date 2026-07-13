import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:dio/dio.dart';
import '../../core/auth_provider.dart';
import '../../core/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _loading = false;
  String? _error;

  Future<void> _submit() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await context.read<AuthProvider>().login(
            _emailController.text.trim(),
            _passwordController.text,
          );
    } on DioException {
      setState(() => _error = 'Email ou mot de passe incorrect');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.local_car_wash, color: AppColors.blue, size: 36),
                    SizedBox(width: 10),
                    Text(
                      'DMS WashControl',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                const SizedBox(height: 32),
                TextField(
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(labelText: 'Email'),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(labelText: 'Mot de passe'),
                ),
                if (_error != null) ...[
                  const SizedBox(height: 12),
                  Text(_error!, style: const TextStyle(color: AppColors.danger)),
                ],
                const SizedBox(height: 24),
                ElevatedButton(
                  onPressed: _loading ? null : _submit,
                  child: Text(_loading ? 'Connexion...' : 'Se connecter'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
