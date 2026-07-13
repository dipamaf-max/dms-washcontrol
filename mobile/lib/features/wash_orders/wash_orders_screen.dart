import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/models.dart';
import '../../core/station_provider.dart';
import '../../core/theme.dart';

class WashOrdersScreen extends StatefulWidget {
  const WashOrdersScreen({super.key});

  @override
  State<WashOrdersScreen> createState() => _WashOrdersScreenState();
}

class _WashOrdersScreenState extends State<WashOrdersScreen> {
  List<WashOrder> _orders = [];
  bool _loading = true;

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
      '/wash-orders',
      queryParameters: {'stationId': stationId},
    );
    setState(() {
      _orders = (response.data as List).map((e) => WashOrder.fromJson(e)).toList();
      _loading = false;
    });
  }

  Future<void> _advance(WashOrder order) async {
    final next = WashOrder.nextStatus[order.status];
    if (next == null) return;
    await ApiClient.instance.dio.patch('/wash-orders/${order.id}/status', data: {'status': next});
    await _load();
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'PENDING':
        return AppColors.warning;
      case 'IN_PROGRESS':
        return AppColors.blueLight;
      case 'DONE':
        return AppColors.success;
      default:
        return AppColors.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Center(child: CircularProgressIndicator());

    return RefreshIndicator(
      onRefresh: _load,
      child: _orders.isEmpty
          ? ListView(
              children: const [
                SizedBox(height: 80),
                Center(
                  child: Text('Aucun lavage en cours', style: TextStyle(color: AppColors.muted)),
                ),
              ],
            )
          : ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: _orders.length,
              separatorBuilder: (_, __) => const SizedBox(height: 12),
              itemBuilder: (context, index) {
                final order = _orders[index];
                final next = WashOrder.nextStatus[order.status];
                return Card(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(order.vehicle.plateNumber,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: _statusColor(order.status).withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                WashOrder.statusLabels[order.status] ?? order.status,
                                style: TextStyle(color: _statusColor(order.status), fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(order.customer.fullName,
                            style: const TextStyle(color: AppColors.muted)),
                        Text('${order.service.name} - ${order.price} FCFA'),
                        if (next != null) ...[
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: OutlinedButton(
                              onPressed: () => _advance(order),
                              child: Text(WashOrder.actionLabels[next] ?? next),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
