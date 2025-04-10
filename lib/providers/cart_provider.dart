import 'package:flutter/material.dart';
import 'package:food_order_app/models/cart_item.dart';
import 'package:food_order_app/models/food_item.dart';

class CartProvider with ChangeNotifier {
  final List<CartItem> _items = [];
  
  List<CartItem> get items => [..._items];
  
  int get itemCount => _items.length;
  
  double get totalAmount {
    return _items.fold(0.0, (sum, item) => sum + (item.price * item.quantity));
  }
  
  void addItem(FoodItem foodItem, int quantity) {
    final existingIndex = _items.indexWhere((item) => item.id == foodItem.id);
    
    if (existingIndex >= 0) {
      // Item already exists, update quantity
      _items[existingIndex] = CartItem(
        id: _items[existingIndex].id,
        name: _items[existingIndex].name,
        price: _items[existingIndex].price,
        quantity: _items[existingIndex].quantity + quantity,
        imageUrl: _items[existingIndex].imageUrl,
      );
    } else {
      // Add new item
      _items.add(
        CartItem(
          id: foodItem.id,
          name: foodItem.name,
          price: foodItem.price,
          quantity: quantity,
          imageUrl: foodItem.imageUrl,
        ),
      );
    }
    
    notifyListeners();
  }
  
  void removeItem(String id) {
    _items.removeWhere((item) => item.id == id);
    notifyListeners();
  }
  
  void updateQuantity(String id, int quantity) {
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    
    final existingIndex = _items.indexWhere((item) => item.id == id);
    if (existingIndex >= 0) {
      _items[existingIndex] = CartItem(
        id: _items[existingIndex].id,
        name: _items[existingIndex].name,
        price: _items[existingIndex].price,
        quantity: quantity,
        imageUrl: _items[existingIndex].imageUrl,
      );
      notifyListeners();
    }
  }
  
  void clear() {
    _items.clear();
    notifyListeners();
  }
}
