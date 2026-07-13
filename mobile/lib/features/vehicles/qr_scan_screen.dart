import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:dio/dio.dart';
import '../../core/api_client.dart';
import '../../core/theme.dart';
import 'vehicle_detail_screen.dart';

class QrScanScreen extends StatefulWidget {
  const QrScanScreen({super.key});

  @override
  State<QrScanScreen> createState() => _QrScanScreenState();
}

class _QrScanScreenState extends State<QrScanScreen> {
  bool _handled = false;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_handled) return;
    final token = capture.barcodes.firstOrNull?.rawValue;
    if (token == null) return;
    _handled = true;

    try {
      final response = await ApiClient.instance.dio.get('/vehicles/qr/$token');
      if (!mounted) return;
      await Navigator.of(context).push(
        MaterialPageRoute(builder: (_) => VehicleDetailScreen(vehicle: response.data)),
      );
    } on DioException {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('QR Code inconnu ou accès refusé')),
        );
      }
    } finally {
      _handled = false;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Scanner un véhicule')),
      body: Stack(
        children: [
          MobileScanner(onDetect: _onDetect),
          Center(
            child: Container(
              width: 240,
              height: 240,
              decoration: BoxDecoration(
                border: Border.all(color: AppColors.blue, width: 3),
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

extension _FirstOrNull<T> on List<T> {
  T? get firstOrNull => isEmpty ? null : first;
}
