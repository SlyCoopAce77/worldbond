import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';

const EFFECTIVE_DATE = 'January 1, 2025';
const SUPPORT_EMAIL  = 'support@bond.app';

const TERMS_TEXT = `TERMS OF SERVICE
Effective Date: ${EFFECTIVE_DATE}

1. ACCEPTANCE
By creating an account or using Bond ("the App"), you agree to these Terms. If you are under 13 years old you may not use the App.

2. ACCOUNT
You are responsible for your account and all activity under it. Provide accurate information when registering. You may not share or sell your account.

3. USER CONTENT
You own the content you post. By posting, you grant Bond a non-exclusive, royalty-free license to display your content within the App. You are solely responsible for your posts and interactions.

4. PROHIBITED CONDUCT
You must not:
• Post illegal, abusive, harassing, or explicit content
• Impersonate other people or entities
• Use the App for spam or unsolicited commercial messages
• Attempt to hack, reverse-engineer, or disrupt the service
• Use the App if you are under 13 years old

5. MODERATION
Bond may remove content or suspend accounts that violate these Terms at any time and without prior notice.

6. INTELLECTUAL PROPERTY
Bond's name, logo, and technology are owned by Bond. User-generated content remains the property of the respective users.

7. DISCLAIMER
The App is provided "as is" without warranties of any kind, including availability, accuracy, or fitness for a particular purpose.

8. LIMITATION OF LIABILITY
To the maximum extent permitted by law, Bond is not liable for indirect, incidental, or consequential damages arising from use of the App.

9. CHANGES
We may update these Terms. Continued use of the App after changes constitutes acceptance of the revised Terms.

10. GOVERNING LAW
These Terms are governed by the laws of the jurisdiction in which Bond operates.

11. CONTACT
Questions: ${SUPPORT_EMAIL}`;

const PRIVACY_TEXT = `PRIVACY POLICY
Effective Date: ${EFFECTIVE_DATE}

1. INFORMATION WE COLLECT
• Account info: name, email address, date of birth, profile photo
• Content you share: messages, photos, voice notes, live streams
• Usage data: features used, session duration
• Device info: device type and operating system version
• Location: approximate location when you use location features (only while the App is in use)

2. HOW WE USE YOUR INFORMATION
• To provide, maintain, and improve the App
• To match you with other users based on interests and location
• To send notifications you have enabled
• To send password-reset codes when requested
• To enforce our Terms of Service and prevent abuse

3. SHARING OF INFORMATION
We do not sell your personal data. We may share information with:
• Infrastructure providers who help us operate the App (hosting, email delivery)
• Law enforcement when required by applicable law
• Other parties only with your explicit consent

4. DATA RETENTION
We retain your data for as long as your account is active. You can permanently delete your account and all associated data via Settings → Delete Account.

5. CHILDREN'S PRIVACY
Bond is not directed to children under 13. We do not knowingly collect personal information from children under 13. If we become aware that we have, we will delete it promptly.

6. SECURITY
We use industry-standard security measures including HTTPS encrypted connections and hashed password storage. No internet transmission is 100% secure.

7. YOUR RIGHTS
You may:
• Access your personal data by contacting us
• Correct inaccurate data in your profile settings
• Delete your account at any time via Settings → Delete Account
• Withdraw consent for optional data uses

8. LOCATION
Location is only accessed while the App is open and only to show nearby people and places. We do not track your location in the background.

9. CHANGES
We may update this Privacy Policy. We will notify you of material changes through the App or by email.

10. CONTACT
Privacy questions: ${SUPPORT_EMAIL}`;

export default function LegalScreen({ route, navigation }) {
  const type    = route.params?.type || 'terms';
  const isTerms = type === 'terms';
  const title   = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const body    = isTerms ? TERMS_TEXT : PRIVACY_TEXT;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.body}>{body}</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#1C1F23',
  },
  backBtn:  { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#16181C', borderRadius: 12, borderWidth: 1, borderColor: '#2F3336' },
  backIcon: { color: '#fff', fontSize: 26, lineHeight: 30 },
  title:    { color: '#fff', fontSize: 17, fontWeight: '700' },

  scroll: { padding: 20 },
  body:   { color: '#9999bb', fontSize: 13, lineHeight: 22 },
});
