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
import { useTheme } from 'next-themes';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { useLanguage } from '@/contexts/language-context';

export function SettingsPage() {
  const { user, updateUserProfile, updateUserPassword, loading, updateUserSettings } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
  
  const [displayName, setDisplayName] = React.useState(user?.displayName || '');
  const [email, setEmail] = React.useState(user?.email || '');
  const [newPassword, setNewPassword] = React.useState('');
  const [confirmPassword, setConfirmPassword] = React.useState('');
  // @ts-ignore
  const [aiLanguage, setAiLanguage] = React.useState(user?.settings?.language || 'en');
   // @ts-ignore
  const [uiLanguage, setUiLanguage] = React.useState(user?.settings?.uiLanguage || 'en');


  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName !== user?.displayName) {
      await updateUserProfile({ displayName });
      toast({ title: t('success'), description: t('profileUpdatedSuccess') });
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword && newPassword === confirmPassword) {
      try {
        await updateUserPassword(newPassword);
        toast({ title: t('success'), description: t('passwordUpdatedSuccess') });
        setNewPassword('');
        setConfirmPassword('');
      } catch (error: any) {
        toast({ variant: 'destructive', title: t('error'), description: error.message });
      }
    } else {
        toast({ variant: 'destructive', title: t('error'), description: t('passwordsDoNotMatch') });
    }
  };
  
  const handleThemeChange = (isChecked: boolean) => {
    setTheme(isChecked ? 'dark' : 'light');
  };

  const handleSettingsUpdate = async (key: string, value: any) => {
      // @ts-ignore
      const newSettings = { ...user.settings, [key]: value };
      await updateUserSettings(newSettings);
      toast({ title: t('preferencesUpdated'), description: t('newSettingsSaved') });
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>{t('profileSettings')}</CardTitle>
          <CardDescription>{t('updateProfileDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="displayName">{t('displayName')}</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">{t('email')}</Label>
              <Input id="email" value={email} disabled />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {t('saveChanges')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('changePassword')}</CardTitle>
          <CardDescription>{t('updatePasswordDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="newPassword">{t('newPassword')}</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {t('updatePassword')}
            </Button>
          </form>
        </CardContent>
      </Card>

       <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
          <CardDescription>{t('managePreferences')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="ai-language-group">{t('aiLanguage')}</Label>
                    <p className="text-sm text-muted-foreground">{t('aiLanguageDescription')}</p>
                </div>
                <RadioGroup 
                    defaultValue={aiLanguage}
                    id="ai-language-group"
                    className="flex items-center gap-4"
                    onValueChange={(value) => {
                        setAiLanguage(value);
                        handleSettingsUpdate('language', value);
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="ai-lang-en" />
                        <Label htmlFor="ai-lang-en">{t('english')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="es" id="ai-lang-es" />
                        <Label htmlFor="ai-lang-es">{t('spanish')}</Label>
                    </div>
                </RadioGroup>
            </div>
             <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="ui-language-group">{t('appLanguage')}</Label>
                    <p className="text-sm text-muted-foreground">{t('appLanguageDescription')}</p>
                </div>
                <RadioGroup 
                    defaultValue={uiLanguage}
                    id="ui-language-group"
                    className="flex items-center gap-4"
                    onValueChange={(value) => {
                        setUiLanguage(value);
                        handleSettingsUpdate('uiLanguage', value);
                        window.location.reload(); // Reload to apply the new language
                    }}
                >
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="en" id="ui-lang-en" />
                        <Label htmlFor="ui-lang-en">{t('english')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="es" id="ui-lang-es" />
                        <Label htmlFor="ui-lang-es">{t('spanish')}</Label>
                    </div>
                </RadioGroup>
            </div>
            <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                    <Label htmlFor="voice-greeting">{t('aiVoiceGreeting')}</Label>
                    <p className="text-sm text-muted-foreground">{t('voiceGreetingDescription')}</p>
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
                    <Label htmlFor="theme">{t('theme')}</Label>
                    <p className="text-sm text-muted-foreground capitalize">({theme} {t('mode')})</p>
                </div>
                <Switch
                    id="theme-switch"
                    checked={theme === 'dark'}
                    onCheckedChange={handleThemeChange}
                    aria-label={t('toggleDarkMode')}
                />
            </div>
        </CardContent>
      </Card>

    </div>
  );
}
