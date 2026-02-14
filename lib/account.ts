// lib/account.ts
import { supabase } from './supabase';
import { Alert } from 'react-native';

/**
 * Delete the current user's account
 * This will call the edge function that handles the deletion
 */
export async function deleteAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get the current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return { success: false, error: 'No active session' };
    }

    // Call the delete-account edge function
    const { data, error } = await supabase.functions.invoke('delete-account', {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    if (error) {
      console.error('Delete account error:', error);
      return { success: false, error: error.message };
    }

    if (!data?.success) {
      return { success: false, error: data?.error || 'Unknown error' };
    }

    // Sign out locally after successful deletion
    await supabase.auth.signOut();

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error deleting account:', error);
    return { success: false, error: error.message || 'Unexpected error' };
  }
}

/**
 * Show confirmation dialog before deleting account
 * Returns true if user confirmed and deletion was successful
 */
export async function confirmAndDeleteAccount(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.\n\n' +
      'All your data will be permanently deleted, including:\n' +
      '• Profile information\n' +
      '• Subscription data\n' +
      '• Preferences and settings\n\n' +
      'Your active subscription (if any) will continue until the end of the billing period. ' +
      'Cancel your subscription in Settings before deleting your account if you want to avoid future charges.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(false),
        },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: async () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your last chance. Are you absolutely sure you want to delete your account?',
              [
                {
                  text: 'Cancel',
                  style: 'cancel',
                  onPress: () => resolve(false),
                },
                {
                  text: 'Yes, Delete',
                  style: 'destructive',
                  onPress: async () => {
                    const result = await deleteAccount();
                    
                    if (result.success) {
                      Alert.alert(
                        'Account Deleted',
                        'Your account has been permanently deleted.',
                        [{ text: 'OK', onPress: () => resolve(true) }]
                      );
                    } else {
                      Alert.alert(
                        'Error',
                        `Failed to delete account: ${result.error}`,
                        [{ text: 'OK', onPress: () => resolve(false) }]
                      );
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  });
}
