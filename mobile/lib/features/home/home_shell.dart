import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/auth_provider.dart';
import '../../core/station_provider.dart';
import '../dashboard/dashboard_screen.dart';
import '../wash_orders/wash_orders_screen.dart';
import '../vehicles/qr_scan_screen.dart';
import '../vehicles/vehicle_register_screen.dart';
import '../../core/notification_service.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key});

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  int _index = 0;
  bool _stationsLoaded = false;

  static const _screens = [
    DashboardScreen(),
    WashOrdersScreen(),
    VehicleRegisterScreen(),
  ];

  static const _titles = ['Tableau de bord', 'Lavages', 'Nouveau véhicule'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await context.read<StationProvider>().load();
      if (mounted) setState(() => _stationsLoaded = true);
      NotificationService.init();
    });
  }

  @override
  Widget build(BuildContext context) {
    final stationProvider = context.watch<StationProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          if (_stationsLoaded && stationProvider.stations.length > 1)
            DropdownButton<String>(
              value: stationProvider.currentStationId,
              underline: const SizedBox.shrink(),
              dropdownColor: Theme.of(context).cardColor,
              items: stationProvider.stations
                  .map((s) => DropdownMenuItem(value: s.id, child: Text(s.name)))
                  .toList(),
              onChanged: (id) {
                if (id != null) context.read<StationProvider>().setCurrentStation(id);
              },
            ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              context.read<StationProvider>().reset();
              context.read<AuthProvider>().logout();
            },
          ),
        ],
      ),
      body: _screens[_index],
      floatingActionButton: FloatingActionButton(
        onPressed: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => const QrScanScreen()),
        ),
        child: const Icon(Icons.qr_code_scanner),
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          BottomNavigationBarItem(icon: Icon(Icons.local_car_wash), label: 'Lavages'),
          BottomNavigationBarItem(icon: Icon(Icons.directions_car), label: 'Véhicule'),
        ],
      ),
    );
  }
}
