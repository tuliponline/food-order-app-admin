import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:food_order_app/models/food_item.dart';
import 'package:food_order_app/providers/auth_provider.dart';
import 'package:food_order_app/screens/cart_screen.dart';
import 'package:food_order_app/screens/food_detail_screen.dart';
import 'package:food_order_app/screens/profile_screen.dart';
import 'package:food_order_app/services/food_service.dart';
import 'package:food_order_app/widgets/category_card.dart';
import 'package:food_order_app/widgets/food_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final FoodService _foodService = FoodService();
  List<FoodItem> _popularItems = [];
  List<String> _categories = [];
  String _selectedCategory = '';
  List<FoodItem> _categoryItems = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final allItems = await _foodService.getFoodItems();
      final categories = await _foodService.getCategories();

      setState(() {
        _popularItems = allItems.take(5).toList();
        _categories = categories;
        if (categories.isNotEmpty) {
          _selectedCategory = categories.first;
          _loadCategoryItems(_selectedCategory);
        }
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading data: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _loadCategoryItems(String category) async {
    setState(() {
      _isLoading = true;
      _selectedCategory = category;
    });

    try {
      final items = await _foodService.getFoodItemsByCategory(category);
      setState(() {
        _categoryItems = items;
        _isLoading = false;
      });
    } catch (e) {
      print('Error loading category items: $e');
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.userModel;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Food Delivery',
              style: TextStyle(
                color: Color(0xFFFF4500),
                fontWeight: FontWeight.bold,
              ),
            ),
            if (user != null)
              Text(
                'Hello, ${user.name.split(' ').first}',
                style: const TextStyle(
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_cart_outlined),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const CartScreen()),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: _loadData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Search Bar
                    TextField(
                      decoration: InputDecoration(
                        hintText: 'Search for food...',
                        prefixIcon: const Icon(Icons.search),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(10),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor: Colors.grey.shade100,
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Popular Items
                    const Text(
                      'Popular Items',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 200,
                      child: _popularItems.isEmpty
                          ? const Center(child: Text('No popular items found'))
                          : ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _popularItems.length,
                              itemBuilder: (context, index) {
                                return Padding(
                                  padding: const EdgeInsets.only(right: 16),
                                  child: FoodCard(
                                    foodItem: _popularItems[index],
                                    onTap: () {
                                      Navigator.of(context).push(
                                        MaterialPageRoute(
                                          builder: (_) => FoodDetailScreen(
                                            foodItem: _popularItems[index],
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                );
                              },
                            ),
                    ),
                    const SizedBox(height: 24),

                    // Categories
                    const Text(
                      'Categories',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      height: 50,
                      child: _categories.isEmpty
                          ? const Center(child: Text('No categories found'))
                          : ListView.builder(
                              scrollDirection: Axis.horizontal,
                              itemCount: _categories.length,
                              itemBuilder: (context, index) {
                                final category = _categories[index];
                                final isSelected = category == _selectedCategory;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 12),
                                  child: CategoryCard(
                                    title: category,
                                    isSelected: isSelected,
                                    onTap: () => _loadCategoryItems(category),
                                  ),
                                );
                              },
                            ),
                    ),
                    const SizedBox(height: 16),

                    // Category Items
                    _categoryItems.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.only(top: 32),
                              child: Text('No items found in this category'),
                            ),
                          )
                        : GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 0.75,
                              crossAxisSpacing: 16,
                              mainAxisSpacing: 16,
                            ),
                            itemCount: _categoryItems.length,
                            itemBuilder: (context, index) {
                              return FoodCard(
                                foodItem: _categoryItems[index],
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(
                                      builder: (_) => FoodDetailScreen(
                                        foodItem: _categoryItems[index],
                                      ),
                                    ),
                                  );
                                },
                              );
                            },
                          ),
                  ],
                ),
              ),
            ),
    );
  }
}
