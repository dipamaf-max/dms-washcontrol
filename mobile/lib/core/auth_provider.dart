import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import 'models.dart';

class AuthProvider extends ChangeNotifier {
  AuthUser? _user;
  bool _loading = true;

  AuthUser? get user => _user;
  bool get loading => _loading;
  bool get isAuthenticated => _user != null;

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('accessToken');
    final userJson = prefs.getString('user');
    if (token != null && userJson != null) {
      _user = AuthUser.fromJson(jsonDecode(userJson));
    }
    _loading = false;
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    final response = await ApiClient.instance.dio.post(
      '/auth/login',
      data: {'email': email, 'password': password},
    );
    await _persistSession(response.data);
  }

  Future<void> _persistSession(Map<String, dynamic> data) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('accessToken', data['accessToken']);
    await prefs.setString('refreshToken', data['refreshToken']);
    await prefs.setString('user', jsonEncode(data['user']));
    _user = AuthUser.fromJson(data['user']);
    notifyListeners();
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('accessToken');
    await prefs.remove('refreshToken');
    await prefs.remove('user');
    _user = null;
    notifyListeners();
  }
}
