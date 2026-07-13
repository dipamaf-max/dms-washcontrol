class AuthUser {
  final String id;
  final String email;
  final String fullName;
  final String role;

  AuthUser({required this.id, required this.email, required this.fullName, required this.role});

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'],
        email: json['email'],
        fullName: json['fullName'],
        role: json['role'],
      );
}

class Station {
  final String id;
  final String name;
  final String address;
  final String phone;

  Station({required this.id, required this.name, required this.address, required this.phone});

  factory Station.fromJson(Map<String, dynamic> json) => Station(
        id: json['id'],
        name: json['name'],
        address: json['address'],
        phone: json['phone'],
      );
}

class Customer {
  final String id;
  final String fullName;
  final String phone;
  final int loyaltyPoints;

  Customer({
    required this.id,
    required this.fullName,
    required this.phone,
    required this.loyaltyPoints,
  });

  factory Customer.fromJson(Map<String, dynamic> json) => Customer(
        id: json['id'],
        fullName: json['fullName'],
        phone: json['phone'],
        loyaltyPoints: json['loyaltyPoints'] ?? 0,
      );
}

class Vehicle {
  final String id;
  final String plateNumber;
  final String type;
  final String qrCodeToken;
  final String customerId;
  final Customer? customer;

  Vehicle({
    required this.id,
    required this.plateNumber,
    required this.type,
    required this.qrCodeToken,
    required this.customerId,
    this.customer,
  });

  factory Vehicle.fromJson(Map<String, dynamic> json) => Vehicle(
        id: json['id'],
        plateNumber: json['plateNumber'],
        type: json['type'],
        qrCodeToken: json['qrCodeToken'],
        customerId: json['customerId'],
        customer: json['customer'] != null ? Customer.fromJson(json['customer']) : null,
      );
}

class ServiceItem {
  final String id;
  final String name;
  final String price;
  final int durationMinutes;

  ServiceItem({
    required this.id,
    required this.name,
    required this.price,
    required this.durationMinutes,
  });

  factory ServiceItem.fromJson(Map<String, dynamic> json) => ServiceItem(
        id: json['id'],
        name: json['name'],
        price: json['price'].toString(),
        durationMinutes: json['durationMinutes'],
      );
}

class WashOrder {
  final String id;
  final String status;
  final String price;
  final Customer customer;
  final Vehicle vehicle;
  final ServiceItem service;

  WashOrder({
    required this.id,
    required this.status,
    required this.price,
    required this.customer,
    required this.vehicle,
    required this.service,
  });

  factory WashOrder.fromJson(Map<String, dynamic> json) => WashOrder(
        id: json['id'],
        status: json['status'],
        price: json['price'].toString(),
        customer: Customer.fromJson(json['customer']),
        vehicle: Vehicle.fromJson(json['vehicle']),
        service: ServiceItem.fromJson(json['service']),
      );

  static const nextStatus = {
    'PENDING': 'IN_PROGRESS',
    'IN_PROGRESS': 'DONE',
    'DONE': 'DELIVERED',
  };

  static const statusLabels = {
    'PENDING': 'En attente',
    'IN_PROGRESS': 'En cours',
    'DONE': 'Terminé',
    'DELIVERED': 'Livré',
  };

  static const actionLabels = {
    'IN_PROGRESS': 'Démarrer',
    'DONE': 'Terminer',
    'DELIVERED': 'Livrer',
  };
}
