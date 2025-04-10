import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:food_order_app/providers/auth_provider.dart';
import 'package:food_order_app/providers/language_provider.dart';
import 'package:food_order_app/screens/auth/login_screen.dart';
import 'package:food_order_app/screens/home_screen.dart';
import 'package:food_order_app/utils/app_localizations.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    // Wait for translations to load
    final languageProvider = Provider.of<LanguageProvider>(context, listen: false);
    if (!languageProvider.isLoaded) {
      await languageProvider.loadTranslations();
    }
    
    // Wait a bit for splash screen
    await Future.delayed(const Duration(seconds: 2));
    if (!mounted) return;
    
    // Check authentication
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    
    if (authProvider.isAuthenticated) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const HomeScreen()),
      );
    } else {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset(
              'assets/images/logo.png',
              width: 150,
              height: 150,
            ),
            const SizedBox(height: 24),
            Consumer<LanguageProvider>(
              builder: (context, languageProvider, _) {
                if (languageProvider.isLoaded) {
                  return Text(
                    context.tr('app_name'),
                    style: const TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFF4500),
                    ),
                  );
                } else {
                  return const Text(
                    'Food Order App',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFFFF4500),
                    ),
                  );
                }
              },
            ),
            const SizedBox(height: 16),
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Color(0xFFFF4500)),
            ),
          ],
        ),
      ),
    );
  }
}
