import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/models.dart';
import '../../core/station_provider.dart';
import '../../core/theme.dart';

class VehicleDetailScreen extends StatefulWidget {
  final Map<String, dynamic> vehicle;

  const VehicleDetailScreen({super.key, required this.vehicle});

  @override
  State<VehicleDetailScreen> createState() => _VehicleDetailScreenState();
}

class _VehicleDetailScreenState extends State<VehicleDetailScreen> {
  List<ServiceItem> _services = [];
  bool _creating = false;

  @override
  void initState() {
    super.initState();
    _loadServices();
  }

  Future<void> _loadServices() async {
    final stationId = context.read<StationProvider>().currentStationId;
    if (stationId == null) return;
    final response = await ApiClient.instance.dio.get(
      '/services',
      queryParameters: {'stationId': stationId},
    );
    setState(() {
      _services = (response.data as List).map((e) => ServiceItem.fromJson(e)).toList();
    });
  }

  Future<void> _createWashOrder(ServiceItem service) async {
    final stationId = context.read<StationProvider>().currentStationId;
    if (stationId == null) return;
    setState(() => _creating = true);
    try {
      await ApiClient.instance.dio.post('/wash-orders', data: {
        'stationId': stationId,
        'customerId': widget.vehicle['customerId'],
        'vehicleId': widget.vehicle['id'],
        'serviceId': service.id,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Lavage enregistré')),
        );
        Navigator.of(context).pop();
      }
    } finally {
      if (mounted) setState(() => _creating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final vehicle = widget.vehicle;
    final customer = vehicle['customer'] as Map<String, dynamic>?;
    final orders = (vehicle['washOrders'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: Text(vehicle['plateNumber'] ?? '')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Client : ${customer?['fullName'] ?? '-'}'),
                  Text('Téléphone : ${customer?['phone'] ?? '-'}'),
                  Text('Points fidélité : ${customer?['loyaltyPoints'] ?? 0}'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Nouveau lavage', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (_services.isEmpty)
            const Text('Chargement des services...', style: TextStyle(color: AppColors.muted)),
          ..._services.map(
            (s) => Card(
              child: ListTile(
                title: Text(s.name),
                subtitle: Text('${s.price} FCFA - ${s.durationMinutes} min'),
                trailing: _creating
                    ? const SizedBox(
                        width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.add_circle, color: AppColors.blue),
                onTap: _creating ? null : () => _createWashOrder(s),
              ),
            ),
          ),
          const SizedBox(height: 24),
          const Text('Historique', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          if (orders.isEmpty)
            const Text('Aucun lavage précédent', style: TextStyle(color: AppColors.muted)),
          ...orders.map((o) => Card(
                child: ListTile(
                  title: Text(o['service']?['name'] ?? ''),
                  subtitle: Text(WashOrder.statusLabels[o['status']] ?? o['status']),
                  trailing: Text('${o['price']} FCFA'),
                ),
              )),
        ],
      ),
    );
  }
}
