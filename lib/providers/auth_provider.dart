import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:food_order_app/models/user_model.dart';

class AuthProvider with ChangeNotifier {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;
  
  User? _user;
  UserModel? _userModel;
  bool _isLoading = false;
  String _error = '';
  
  User? get user => _user;
  UserModel? get userModel => _userModel;
  bool get isLoading => _isLoading;
  String get error => _error;
  bool get isAuthenticated => _user != null;
  
  AuthProvider() {
    _auth.authStateChanges().listen((User? user) {
      _user = user;
      if (user != null) {
        _fetchUserData();
      } else {
        _userModel = null;
      }
      notifyListeners();
    });
  }
  
  Future<void> _fetchUserData() async {
    if (_user == null) return;
    
    try {
      final doc = await _firestore.collection('users').doc(_user!.uid).get();
      if (doc.exists) {
        _userModel = UserModel.fromMap(doc.data()!, doc.id);
      }
      notifyListeners();
    } catch (e) {
      _error = e.toString();
      notifyListeners();
    }
  }
  
  Future<bool> signUp(String name, String email, String password, String phone, String address) async {
    _isLoading = true;
    _error = '';
    notifyListeners();
    
    try {
      final UserCredential userCredential = await _auth.createUserWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      if (userCredential.user != null) {
        // Create user profile in Firestore
        final userData = {
          'name': name,
          'email': email,
          'phone': phone,
          'address': address,
          'createdAt': FieldValue.serverTimestamp(),
        };
        
        await _firestore.collection('users').doc(userCredential.user!.uid).set(userData);
        await _fetchUserData();
        _isLoading = false;
        notifyListeners();
        return true;
      }
      
      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _error = '';
    notifyListeners();
    
    try {
      await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
  
  Future<void> signOut() async {
    _isLoading = true;
    notifyListeners();
    
    try {
      await _auth.signOut();
      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
    }
  }
  
  Future<bool> updateProfile({String? name, String? phone, String? address}) async {
    if (_user == null) return false;
    
    _isLoading = true;
    notifyListeners();
    
    try {
      final Map<String, dynamic> updateData = {};
      
      if (name != null && name.isNotEmpty) {
        updateData['name'] = name;
      }
      
      if (phone != null && phone.isNotEmpty) {
        updateData['phone'] = phone;
      }
      
      if (address != null && address.isNotEmpty) {
        updateData['address'] = address;
      }
      
      if (updateData.isNotEmpty) {
        await _firestore.collection('users').doc(_user!.uid).update(updateData);
        await _fetchUserData();
      }
      
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }
}
