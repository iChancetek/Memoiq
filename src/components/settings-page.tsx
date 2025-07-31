
'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Moon, Sun, Languages } from 'lucide-react';
import { Switch } from './ui/switch';
import { useTheme } from '@/contexts/theme-context';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export function SettingsPage() {
  const { user, updateUserProfile, updateUserPassword, loading, updateUserSettings } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  // @ts-ignore
  const [language, setLanguage] = React.useState(user?.settings?.language || 'en');

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName !== user?.displayName) {
      await updateUserProfile({ displayName });
      toast({ title: "Success", description: "Profile updated successfully." });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      try {
        await updateUserPassword(newPassword);
        toast({ title: "Success", description: "Password updated successfully." });
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        toast({ variant: 'destructive', title: "Error", description: error.message });
      }
    } else {
        toast({ variant: 'destructive', title: "Error", description: "Passwords do not match." });
    }
  };
  
  const handleThemeChange = (isChecked: boolean) => {
    setTheme(isChecked ? 'dark' : 'light');
  };

  const handleSettingsUpdate = async (key: string, value: any) => {
      // @ts-ignore
      const newSettings = { ...user.settings, [key]: value };
      await updateUserSettings(newSettings);
      toast({ title: "Preferences Updated", description: "Your new settings have been saved." });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Profile Settings</CardTitle>
          <CardDescription>Update your display name and email.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={email} disabled />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your application preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="language-group">Language</Label>
                    <p className="text-sm text-muted-foreground">Set the language for AI interactions.</p>
                </div>
                <RadioGroup 
                    defaultValue={language}
                    id="language-group"
                    className="flex items-center gap-4"
                    onValueChange={(value) => {
                        setLanguage(value);
                        handleSettingsUpdate('language', value);
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="lang-en" />
                        <Label htmlFor="lang-en">English</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="es" id="lang-es" />
                        <Label htmlFor="lang-es">Español</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="voice-greeting">AI Voice Greeting</Label>
                    <p className="text-sm text-muted-foreground">Enable a voice greeting on login.</p>
                </div>
                <Switch 
                    id="voice-greeting" 
                    // @ts-ignore
                    defaultChecked={user?.settings?.enableVoiceGreeting} 
                    onCheckedChange={(checked) => handleSettingsUpdate('enableVoiceGreeting', checked)}
                />
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className='flex items-center space-x-2'>
                    <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                    <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    <Label htmlFor="theme">Theme</Label>
                    <p className="text-sm text-muted-foreground capitalize">({theme} mode)</p>
                </div>
                <Switch
                    id="theme-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    aria-label="Toggle dark mode"
                />
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
