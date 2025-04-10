class CartItem {
  final String id;
  final String name;
  final double price;
  final int quantity;
  final String imageUrl;
  
  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.quantity,
    required this.imageUrl,
  });
  
  double get total => price * quantity;
}
