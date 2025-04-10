import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'package:food_order_app/providers/auth_provider.dart';
import 'package:food_order_app/providers/cart_provider.dart';
import 'package:food_order_app/providers/language_provider.dart';
import 'package:food_order_app/screens/splash_screen.dart';
import 'package:food_order_app/utils/theme.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(
    options: const FirebaseOptions(
      apiKey: String.fromEnvironment('FIREBASE_API_KEY'),
      appId: String.fromEnvironment('FIREBASE_APP_ID'),
      messagingSenderId: String.fromEnvironment('FIREBASE_MESSAGING_SENDER_ID'),
      projectId: String.fromEnvironment('FIREBASE_PROJECT_ID'),
      storageBucket: String.fromEnvironment('FIREBASE_STORAGE_BUCKET'),
      authDomain: String.fromEnvironment('FIREBASE_AUTH_DOMAIN'),
    ),
  );
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => CartProvider()),
      ],
      child: Consumer<LanguageProvider>(
        builder: (context, languageProvider, _) {
          return MaterialApp(
            title: 'Food Order App',
            debugShowCheckedModeBanner: false,
            theme: appTheme,
            locale: languageProvider.currentLocale,
            supportedLocales: const [
              Locale('en'), // English
              Locale('lo'), // Lao
              Locale('th'), // Thai
            ],
            localizationsDelegates: const [
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}
