import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:food_order_app/providers/language_provider.dart';

class AppLocalizations {
  static String translate(BuildContext context, String key) {
    return Provider.of<LanguageProvider>(context, listen: false).translate(key);
  }

  static String translateWithParams(
    BuildContext context, 
    String key, 
    Map<String, String> params
  ) {
    return Provider.of<LanguageProvider>(context, listen: false)
        .translateWithParams(key, params);
  }
}

// Extension method for easier access
extension TranslateX on BuildContext {
  String tr(String key) => AppLocalizations.translate(this, key);
  
  String trParams(String key, Map<String, String> params) => 
      AppLocalizations.translateWithParams(this, key, params);
}
