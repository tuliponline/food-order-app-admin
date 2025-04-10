import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_storage/firebase_storage.dart';

class FirebaseChecker {
  static Future<Map<String, bool>> checkFirebaseServices() async {
    Map<String, bool> results = {
      'firestore': false,
      'storage': false,
      'auth': false,
    };
    
    try {
      // Check Firestore
      try {
        await FirebaseFirestore.instance.collection('test').get();
        results['firestore'] = true;
      } catch (e) {
        print('Firestore check failed: $e');
      }
      
      // Check Storage
      try {
        await FirebaseStorage.instance.ref().child('test').listAll();
        results['storage'] = true;
      } catch (e) {
        print('Storage check failed: $e');
      }
      
      return results;
    } catch (e) {
      print('Firebase services check failed: $e');
      return results;
    }
  }
  
  static Future<void> showFirebaseStatusDialog(BuildContext context) async {
    final results = await checkFirebaseServices();
    
    if (context.mounted) {
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Firebase Status'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildStatusRow('Firestore', results['firestore'] ?? false),
              const SizedBox(height: 8),
              _buildStatusRow('Storage', results['storage'] ?? false),
              const SizedBox(height: 8),
              _buildStatusRow('Auth', results['auth'] ?? false),
              const SizedBox(height: 16),
              const Text(
                'If any service is not working, please check your Firebase configuration and permissions.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        ),
      );
    }
  }
  
  static Widget _buildStatusRow(String service, bool isWorking) {
    return Row(
      children: [
        Text('$service: '),
        if (isWorking)
          const Icon(Icons.check_circle, color: Colors.green, size: 16)
        else
          const Icon(Icons.error, color: Colors.red, size: 16),
        const SizedBox(width: 4),
        Text(
          isWorking ? 'Working' : 'Not working',
          style: TextStyle(
            color: isWorking ? Colors.green : Colors.red,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }
}
