import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:food_order_app/models/food_item.dart';

class FoodService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  Future<List<FoodItem>> getFoodItems() async {
    try {
      final QuerySnapshot snapshot = await _firestore.collection('menuItems').get();
      
      return snapshot.docs.map((doc) {
        return FoodItem.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    } catch (e) {
      print('Error getting food items: $e');
      return [];
    }
  }
  
  Future<List<FoodItem>> getFoodItemsByCategory(String category) async {
    try {
      final QuerySnapshot snapshot = await _firestore
          .collection('menuItems')
          .where('category', isEqualTo: category)
          .get();
      
      return snapshot.docs.map((doc) {
        return FoodItem.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }).toList();
    } catch (e) {
      print('Error getting food items by category: $e');
      return [];
    }
  }
  
  Future<List<String>> getCategories() async {
    try {
      final QuerySnapshot snapshot = await _firestore.collection('menuItems').get();
      
      final Set<String> categories = {};
      for (var doc in snapshot.docs) {
        final data = doc.data() as Map<String, dynamic>;
        if (data.containsKey('category') && data['category'] != null) {
          categories.add(data['category']);
        }
      }
      
      return categories.toList();
    } catch (e) {
      print('Error getting categories: $e');
      return [];
    }
  }
  
  Future<FoodItem?> getFoodItem(String id) async {
    try {
      final DocumentSnapshot doc = await _firestore.collection('menuItems').doc(id).get();
      
      if (doc.exists) {
        return FoodItem.fromMap(doc.data() as Map<String, dynamic>, doc.id);
      }
      
      return null;
    } catch (e) {
      print('Error getting food item: $e');
      return null;
    }
  }
}
