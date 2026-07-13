import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

const String kApiBaseUrl = String.fromEnvironment(
  'API_URL',
  defaultValue: 'http://10.0.2.2:3000/api/v1',
);

class ApiClient {
  ApiClient._internal() {
    _dio = Dio(BaseOptions(baseUrl: kApiBaseUrl));
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('accessToken');
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          if (error.response?.statusCode == 401) {
            final refreshed = await _tryRefreshToken();
            if (refreshed) {
              final prefs = await SharedPreferences.getInstance();
              final token = prefs.getString('accessToken');
              final options = error.requestOptions;
              options.headers['Authorization'] = 'Bearer $token';
              try {
                final response = await _dio.fetch(options);
                return handler.resolve(response);
              } catch (_) {
                // fall through to error
              }
            }
          }
          handler.next(error);
        },
      ),
    );
  }

  static final ApiClient instance = ApiClient._internal();
  late final Dio _dio;

  Dio get dio => _dio;

  Future<bool> _tryRefreshToken() async {
    final prefs = await SharedPreferences.getInstance();
    final refreshToken = prefs.getString('refreshToken');
    if (refreshToken == null) return false;

    try {
      final response = await Dio(BaseOptions(baseUrl: kApiBaseUrl))
          .post('/auth/refresh', data: {'refreshToken': refreshToken});
      await prefs.setString('accessToken', response.data['accessToken']);
      await prefs.setString('refreshToken', response.data['refreshToken']);
      return true;
    } catch (_) {
      await prefs.remove('accessToken');
      await prefs.remove('refreshToken');
      return false;
    }
  }
}
