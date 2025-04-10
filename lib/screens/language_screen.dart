import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:food_order_app/providers/language_provider.dart';
import 'package:food_order_app/utils/app_localizations.dart';

class LanguageScreen extends StatelessWidget {
  const LanguageScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final languageProvider = Provider.of<LanguageProvider>(context);
    
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('select_language')),
      ),
      body: ListView(
        children: [
          _buildLanguageItem(
            context,
            'English',
            'en',
            languageProvider,
          ),
          _buildLanguageItem(
            context,
            'ລາວ',
            'lo',
            languageProvider,
          ),
          _buildLanguageItem(
            context,
            'ไทย',
            'th',
            languageProvider,
          ),
        ],
      ),
    );
  }

  Widget _buildLanguageItem(
    BuildContext context,
    String title,
    String languageCode,
    LanguageProvider languageProvider,
  ) {
    final isSelected = languageProvider.currentLocale.languageCode == languageCode;
    
    return ListTile(
      title: Text(title),
      trailing: isSelected
          ? const Icon(
              Icons.check_circle,
              color: Color(0xFFFF4500),
            )
          : null,
      onTap: () async {
        await languageProvider.changeLanguage(languageCode);
        if (context.mounted) {
          Navigator.pop(context);
        }
      },
    );
  }
}
