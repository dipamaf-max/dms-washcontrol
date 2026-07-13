import 'package:flutter/material.dart';

class AppColors {
  static const black = Color(0xFF0A0E17);
  static const blackSoft = Color(0xFF11172A);
  static const surface = Color(0xFF161D33);
  static const border = Color(0xFF232B45);
  static const blue = Color(0xFF0057FF);
  static const blueLight = Color(0xFF4D8BFF);
  static const white = Color(0xFFFFFFFF);
  static const muted = Color(0xFF8B93A7);
  static const success = Color(0xFF17C964);
  static const warning = Color(0xFFF5A524);
  static const danger = Color(0xFFF31260);
}

final ThemeData appTheme = ThemeData(
  useMaterial3: true,
  brightness: Brightness.dark,
  scaffoldBackgroundColor: AppColors.black,
  colorScheme: ColorScheme.fromSeed(
    seedColor: AppColors.blue,
    brightness: Brightness.dark,
    primary: AppColors.blue,
    surface: AppColors.surface,
  ),
  cardColor: AppColors.surface,
  appBarTheme: const AppBarTheme(
    backgroundColor: AppColors.blackSoft,
    foregroundColor: AppColors.white,
    elevation: 0,
  ),
  inputDecorationTheme: InputDecorationTheme(
    filled: true,
    fillColor: AppColors.blackSoft,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.border),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(10),
      borderSide: const BorderSide(color: AppColors.blue, width: 1.5),
    ),
  ),
  elevatedButtonTheme: ElevatedButtonThemeData(
    style: ElevatedButton.styleFrom(
      backgroundColor: AppColors.blue,
      foregroundColor: AppColors.white,
      padding: const EdgeInsets.symmetric(vertical: 14),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ),
  ),
  cardTheme: CardThemeData(
    color: AppColors.surface,
    shape: RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(12),
      side: const BorderSide(color: AppColors.border),
    ),
  ),
  bottomNavigationBarTheme: const BottomNavigationBarThemeData(
    backgroundColor: AppColors.blackSoft,
    selectedItemColor: AppColors.blueLight,
    unselectedItemColor: AppColors.muted,
  ),
);
