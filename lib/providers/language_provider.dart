import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences.dart';

class LanguageProvider with ChangeNotifier {
  // Default language is Lao
  Locale _currentLocale = const Locale('lo');
  Map<String, dynamic> _translations = {};
  bool _isLoaded = false;

  Locale get currentLocale => _currentLocale;
  bool get isLoaded => _isLoaded;

  LanguageProvider() {
    _loadSavedLanguage();
  }

  Future<void> _loadSavedLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLanguage = prefs.getString('language');
    
    if (savedLanguage != null) {
      _currentLocale = Locale(savedLanguage);
    }
    
    await loadTranslations();
  }

  Future<void> loadTranslations() async {
    try {
      final jsonString = await rootBundle.loadString(
        'assets/translations/${_currentLocale.languageCode}.json',
      );
      _translations = json.decode(jsonString);
      _isLoaded = true;
      notifyListeners();
    } catch (e) {
      print('Error loading translations: $e');
      // If there's an error, try to load the default language (Lao)
      if (_currentLocale.languageCode != 'lo') {
        _currentLocale = const Locale('lo');
        await loadTranslations();
      }
    }
  }

  Future<void> changeLanguage(String languageCode) async {
    if (_currentLocale.languageCode != languageCode) {
      _currentLocale = Locale(languageCode);
      _isLoaded = false;
      
      // Save the selected language
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('language', languageCode);
      
      await loadTranslations();
    }
  }

  String translate(String key) {
    if (!_isLoaded || !_translations.containsKey(key)) {
      return key;
    }
    return _translations[key];
  }

  String translateWithParams(String key, Map<String, String> params) {
    String text = translate(key);
    
    params.forEach((paramKey, paramValue) {
      text = text.replaceAll('{{$paramKey}}', paramValue);
    });
    
    return text;
  }
}
