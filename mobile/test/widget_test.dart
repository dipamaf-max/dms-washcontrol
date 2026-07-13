import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:dms_washcontrol/main.dart';

void main() {
  testWidgets('App boots and shows the login screen', (WidgetTester tester) async {
    SharedPreferences.setMockInitialValues({});

    await tester.pumpWidget(const DmsWashControlApp());
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 100));

    expect(find.text('DMS WashControl'), findsOneWidget);
    expect(find.text('Se connecter'), findsOneWidget);
  });
}
