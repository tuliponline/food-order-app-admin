import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:food_order_app/models/cart_item.dart';
import 'package:food_order_app/models/order.dart';
import 'package:food_order_app/models/user_model.dart';

class OrderService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  final FirebaseAuth _auth = FirebaseAuth.instance;
  
  Future<String?> placeOrder(List<CartItem> items, double total, UserModel user) async {
    try {
      if (_auth.currentUser == null) {
        throw Exception('User not authenticated');
      }
      
      final orderData = {
        'userId': _auth.currentUser!.uid,
        'userName': user.name,
        'items': items.map((item) => {
          'id': item.id,
          'name': item.name,
          'price': item.price,
          'quantity': item.quantity,
          'imageUrl': item.imageUrl,
        }).toList(),
        'total': total,
        'status': 'pending',
        'address': user.address,
        'phone': user.phone,
        'createdAt': FieldValue.serverTimestamp(),
      };
      
      final docRef = await _firestore.collection('orders').add(orderData);
      return docRef.id;
    } catch (e) {
      print('Error placing order: $e');
      return null;
    }
  }
  
  Future<List<Order>> getUserOrders() async {
    try {
      if (_auth.currentUser == null) {
        throw Exception('User not authenticated');
      }
      
      final QuerySnapshot snapshot = await _firestore
          .collection('orders')
          .where('userId', isEqualTo: _auth.currentUser!.uid)
          .orderBy('createdAt', descending: true)
          .get();
      
      return snapshot.docs.map((doc) {
        return Order.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    } catch (e) {
      print('Error getting user orders: $e');
      return [];
    }
  }
  
  Future<Order?> getOrder(String id) async {
    try {
      final DocumentSnapshot doc = await _firestore.collection('orders').doc(id).get();
      
      if (doc.exists) {
        return Order.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      
      return null;
    } catch (e) {
      print('Error getting order: $e');
      return null;
    }
  }
}
