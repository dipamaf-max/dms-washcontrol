import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/api_client.dart';
import '../../core/station_provider.dart';

const _vehicleTypes = ['CAR', 'SUV', 'MOTORCYCLE', 'VAN', 'TRUCK', 'OTHER'];

class VehicleRegisterScreen extends StatefulWidget {
  const VehicleRegisterScreen({super.key});

  @override
  State<VehicleRegisterScreen> createState() => _VehicleRegisterScreenState();
}

class _VehicleRegisterScreenState extends State<VehicleRegisterScreen> {
  final _customerNameController = TextEditingController();
  final _customerPhoneController = TextEditingController();
  final _plateController = TextEditingController();
  String _type = 'CAR';
  bool _saving = false;

  Future<void> _submit() async {
    final stationId = context.read<StationProvider>().currentStationId;
    if (stationId == null) return;

    setState(() => _saving = true);
    try {
      final customerResponse = await ApiClient.instance.dio.post('/customers', data: {
        'fullName': _customerNameController.text.trim(),
        'phone': _customerPhoneController.text.trim(),
        'stationId': stationId,
      });

      await ApiClient.instance.dio.post('/vehicles', data: {
        'plateNumber': _plateController.text.trim(),
        'type': _type,
        'customerId': customerResponse.data['id'],
        'stationId': stationId,
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Véhicule enregistré avec succès')),
        );
        _customerNameController.clear();
        _customerPhoneController.clear();
        _plateController.clear();
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nouveau véhicule')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          const Text('Client', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _customerNameController,
            decoration: const InputDecoration(labelText: 'Nom complet'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _customerPhoneController,
            keyboardType: TextInputType.phone,
            decoration: const InputDecoration(labelText: 'Téléphone'),
          ),
          const SizedBox(height: 24),
          const Text('Véhicule', style: TextStyle(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          TextField(
            controller: _plateController,
            decoration: const InputDecoration(labelText: "Plaque d'immatriculation"),
          ),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            initialValue: _type,
            decoration: const InputDecoration(labelText: 'Type de véhicule'),
            items: _vehicleTypes
                .map((t) => DropdownMenuItem(value: t, child: Text(t)))
                .toList(),
            onChanged: (value) => setState(() => _type = value ?? 'CAR'),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _saving ? null : _submit,
            child: Text(_saving ? 'Enregistrement...' : 'Enregistrer le véhicule'),
          ),
        ],
      ),
    );
  }
}
