import 'package:food_order_app/models/cart_item.dart';

class Order {
  final String id;
  final String userId;
  final List<CartItem> items;
  final double total;
  final String status;
  final String address;
  final String phone;
  final DateTime createdAt;
  
  Order({
    required this.id,
    required this.userId,
    required this.items,
    required this.total,
    required this.status,
    required this.address,
    required this.phone,
    required this.createdAt,
  });
  
  factory Order.fromMap(Map<String, dynamic> map, String id) {
    return Order(
      id: id,
      userId: map['userId'] ?? '',
      items: (map['items'] as List<dynamic>?)?.map((item) => CartItem(
        id: item['id'],
        name: item['name'],
        price: (item['price'] ?? 0.0).toDouble(),
        quantity: item['quantity'] ?? 0,
        imageUrl: item['imageUrl'] ?? '',
      )).toList() ?? [],
      total: (map['total'] ?? 0.0).toDouble(),
      status: map['status'] ?? 'pending',
      address: map['address'] ?? '',
      phone: map['phone'] ?? '',
      createdAt: map['createdAt'] != null 
          ? (map['createdAt'] as dynamic).toDate() 
          : DateTime.now(),
    );
  }
  
  Map<String, dynamic> toMap() {
    return {
      'userId': userId,
      'items': items.map((item) => {
        'id': item.id,
        'name': item.name,
        'price': item.price,
        'quantity': item.quantity,
        'imageUrl': item.imageUrl,
      }).toList(),
      'total': total,
      'status': status,
      'address': address,
      'phone': phone,
      'createdAt': createdAt,
    };
  }
}
