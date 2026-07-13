import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/station_provider.dart';
import '../../core/theme.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  Map<String, dynamic>? _overview;
  bool _loading = true;
  final _currency = NumberFormat.decimalPattern('fr');

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final stationId = context.read<StationProvider>().currentStationId;
    if (stationId == null) {
      setState(() => _loading = false);
      return;
    }
    setState(() => _loading = true);
    final response = await ApiClient.instance.dio.get(
      '/dashboard/overview',
      queryParameters: {'stationId': stationId},
    );
    setState(() {
      _overview = response.data;
      _loading = false;
    });
  }

  Widget _statCard(String label, String value, {Color? color}) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: const TextStyle(color: AppColors.muted, fontSize: 13)),
            const SizedBox(height: 6),
            Text(value,
                style: TextStyle(
                    fontSize: 20, fontWeight: FontWeight.bold, color: color ?? AppColors.white)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());
    if (_overview == null) {
      return const Center(
        child: Text('Sélectionnez une station', style: TextStyle(color: AppColors.muted)),
      );
    }

    final o = _overview!;
    return RefreshIndicator(
      onRefresh: _load,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: 1.6,
            children: [
              _statCard('CA du jour', '${_currency.format(o['revenueToday'])} FCFA',
                  color: AppColors.blueLight),
              _statCard('Véhicules lavés', '${o['vehiclesWashedToday']}'),
              _statCard('Employés actifs', '${o['activeEmployees']}'),
              _statCard('Bénéfices', '${_currency.format(o['profitToday'])} FCFA',
                  color: AppColors.success),
            ],
          ),
          const SizedBox(height: 24),
          const Text('Meilleurs clients', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          ...(o['topCustomers'] as List).map(
            (c) => Card(
              child: ListTile(
                title: Text(c['fullName']),
                subtitle: Text('${c['washCount']} lavages'),
                trailing: Text('${c['loyaltyPoints']} pts'),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
