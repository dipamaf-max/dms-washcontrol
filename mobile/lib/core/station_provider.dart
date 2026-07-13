import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_client.dart';
import 'models.dart';

class StationProvider extends ChangeNotifier {
  List<Station> _stations = [];
  String? _currentStationId;

  List<Station> get stations => _stations;
  String? get currentStationId => _currentStationId;

  Future<void> load() async {
    final response = await ApiClient.instance.dio.get('/stations');
    _stations = (response.data as List).map((e) => Station.fromJson(e)).toList();

    final prefs = await SharedPreferences.getInstance();
    _currentStationId = prefs.getString('currentStationId');
    if ((_currentStationId == null || !_stations.any((s) => s.id == _currentStationId)) &&
        _stations.isNotEmpty) {
      _currentStationId = _stations.first.id;
      await prefs.setString('currentStationId', _currentStationId!);
    }
    notifyListeners();
  }

  Future<void> setCurrentStation(String id) async {
    _currentStationId = id;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('currentStationId', id);
    notifyListeners();
  }

  void reset() {
    _stations = [];
    _currentStationId = null;
    notifyListeners();
  }
}
